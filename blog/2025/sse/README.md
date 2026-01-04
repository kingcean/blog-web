## Background

JavaScript's most common method for making backend requests is `fetch`; earlier methods included XHR and JSONP. With the rise of large language models (LLMs), the need to handle server-generated content that is incrementally produced and takes a long time to complete has led to the growing popularity of the Server-Sent Events (SSE) streaming mode. In this mode, the server incrementally outputs content in batches as strings, while the frontend (or client) reads and parses each batch to update UI elements. The complete data can also be integrated and processed according to predefined conventions.

In current standards, the web frontend has an API for reading SSE, known as `EventSource`. This type can be initialized with a URL, and the browser will make the request and reflect received messages via registered event callbacks.

```javascript
const sse = new EventSource(SSE_API_URL);
sse.addEventListener("message", (e) => {
  console.log(e.data);
});
```

However, this API only supports `GET` requests. For the aforementioned LLM example, `POST` requests are more common, which cannot be achieved with this API. This article introduces how to implement a fully functional SSE client using the `fetch` interface to make requests, expecting SSE-formatted responses and parsing them.

## Structure and Parsing

The SSE response content is essentially a string with a `Content-Type` value of `text/event-stream`. Its content represents an array, where each element supports the following fields by default, all of which are optional:

- `event` _string_: The type of the current record item.
- `data`: The content of record item (payload).
- `id` _string_: The record ID.
- `retry` _integer_: Retry interval in seconds.
- (Empty string as the key name) _string_: Comments.

Details:

- The types of the fields above are not escaped or wrapped.
- The `data` content can be plain text, JSON, or other formats, depending on business conventions. The SSE standard does not specify this.
- If `event` is empty, it can be considered as having a value of `message`.

This structure does not use JSON format but is somewhat similar to YAML, though not entirely. Each field is separated by a `\n` newline, and the attribute name and value are separated by a colon `:`. If `data` spans multiple lines (i.e., its content contains `\n`), it is not achieved through escaping but by setting multiple `data` fields, which are ultimately concatenated into a multi-line string (using `\n`).

Based on this, we design a class that accepts a string representing an SSE record item. In the constructor, it parses the string and stores the data in private member fields, exposing corresponding read-only properties for external access.

```typescript
export class ServerSentEventItem {
  private source: Record<string, string>;
  private dataParsedInJson: Record<string, unknown> | undefined;

  constructor(source: string) {
    this.source = {};

    // Parse the SSE record item
    (source || "").split("\n").forEach(line => {
      const pos = line.indexOf(":");
      if (pos < 0) return;
      const key = line.substring(0, pos);
      const value = line.substring(pos + 1);
      if (!this.source[key] || (key !== "data" && key !== "")) this.source[key] = value;
      else this.source[key] += value;
    });
  }

  // Standard fileds of SSE
  get event() {
    return this.source.event || "message";
  }
  get data() {
    return this.source.data;
  }
  get id() {
    return this.source.id;
  }
  get comment() {
    return this.source[""];
  }
  get retry() {
    return this.source.retry ? parseInt(this.source.retry, 10) : undefined;
  }

  // Get data parsed to JSON
  dataJson<T = Record<string, unknown>>() {
    const data = this.source.data;
    if (!data) return undefined;
    if (!this.dataParsedInJson) this.dataParsedInJson = JSON.parse(data);
    return this.dataParsedInJson as T;
  }

  // Get original value of specific field
  get(key: string) {
    return this.source[key];
  }
}
```

These read-only properties return SSE standard fields and provide a `get` method for retrieving raw values of fields and non-standard fields. Additionally, considering that `data` is often expected to be JSON content, the `dataJson` method parses and caches the content.

## Stream Processing

An SSE request result is usually a series of instances of this type, which can notify external events for business use. However, as mentioned earlier, the information from the server is essentially a string transmitted in chunks.

Using the `fetch` interface's return value, we can obtain a reader instance from its `body` content stream. Then, in a loop, we continuously call the reader's `read` method to check whether the stream is complete and retrieve the current value. This value needs to be converted into a final string using a decoder, requiring a `TextDecoder` string decoder. Ideally, each read value should be an SSE record item, but to be safe, we store the read strings and check whether they contain single or multiple record items.

The SSE specification defines that items are separated by two consecutive `\n` newline characters (`\n\n`). Therefore, we can use this as a keyword for splitting. When complete items are extracted from the cache, the previously implemented `ServerSentEventItem` class can be used to parse them and trigger corresponding events.

```typescript
async function handleSse(response: Response, decoder: TextDecoder, callback: ((item: ServerSentEventItem) => void)) {
  // Initialize
  if (!resp.body) return Promise.reject("no response body");
  const reader = resp.body.getReader();
  let buffer = "";
  const arr: ServerSentEventItem[] = [];

  // Read buffer in loop
  while (true) {
    const { done, value } = await reader.read();
    if (done) { // Ending
      convertSse(buffer, arr, callback);
      return arr;
    }

    // Decode into buffer
    buffer += decoder.decode(value, { stream: true });

    // Split each item
    const messages = buffer.split("\n\n");
    if (messages.length < 2) continue;
    buffer = messages.pop() || "";

    // Converts all items to the instances
    messages.forEach(msg => {
      convertSse(msg, arr, callback);
    });
  }
}

function convertSse(msg: string, arr: ServerSentEventItem[], callback: ((item: ServerSentEventItem) => void)) {
  if (!msg) return;

  // Parse and raise callback for each.
  const sse = new ServerSentEventItem(msg);
  arr.push(sse);
  callback(sse);
  return sse;
}
```

## Request and Encapsulation

After parsing the response content stream, the next critical step is making requests to the backend API. Here, we use the standard `fetch` interface to make requests and read its response content (`body`) as a stream, decoding it into UTF-8. To reduce the learning curve, the input and output mimic existing patterns.

- The overall implementation is a class that follows the structure of the existing GET-only SSE implementation `EventSource`. It provides responses externally via event registration, inheriting from the `EventTarget` class designed for sending and receiving events.
- The constructor accepts parameters similar to `fetch`, passing them to the `fetch` interface to make requests. The returned content can then use the `getReader` method to obtain a stream-reading instance.

```typescript
export class SseClient extends EventTarget {
  private internal: {
    readyState?: number;
    url?: string;
    promise?: Promise<ServerSentEventItem[]>;
  } = {
    readyState: 0,
  };

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super();

    // Get URL
    if (typeof input === "string") this.internal.url = input;
    else if (input instanceof URL) this.internal.url = input.toString();
    else this.internal.url = input?.url;

    // Get response by fetch
    this.internal.promise = fetch(input, init).then(r => {
      // Update state
      this.internal.readyState = EventSource.OPEN;
      this.dispatchEvent(new Event("open"));

      // Streaming handling
      return handleSse(r, new TextDecoder("utf-8"), item => {
        this.dispatchEvent(new MessageEvent(item.event, { data: item }));
      });
    }).then(arr => { // Happy path
      this.internal.readyState = EventSource.CLOSED;
      return arr;
    }, err => { // Error handling
      this.internal.readyState = EventSource.CLOSED;
      this.dispatchEvent(new Event("error"));
    });

    // Register all event callbacks of on series
    this.addEventListener("open", ev => {
      if (typeof this.onopen === "function") this.onopen(ev);
    })
    this.addEventListener("message", ev => {
      if (typeof this.onmessage === "function") this.onmessage(ev as MessageEvent);
    })
    this.addEventListener("error", ev => {
      if (typeof this.onerror === "function") this.onerror(ev);
    })
  }

  // The on series event callbacks
  onopen: ((ev: Event) => any) | null | undefined;
  onmessage: ((ev: MessageEvent) => any) | null | undefined;
  onerror: ((ev: Event) => any) | null | undefined;

  // Get basic info
  get url() {
    return this.internal.url;
  }
  get readyState() {
    return this.internal.readyState;
  }

  // Wait async by Promise
  wait() {
    return this.internal.promise;
  }
}
```

Once initialized, the object immediately triggers `fetch` to create a connection. In the JavaScript world, since scripts run in a single thread, the callback injected by `Promise` is not executed immediately but waits until the current fiber (execution segment in thread) ends. This means that subsequent logic executed sequentially will fully trigger event functions registered via `addEventListener` on this instance. In this case, no prior events will be missed. This completes the core functionality.

## Usage

Suppose we want to make a `POST` request to a specific web API and expect an SSE response. This can be done with the following simple and familiar code:

```javascript
// Initialize an instance and fetch
const sse = new SseClient(SSE_API_URL, {
  method: "POST",
  body: JSON.stringify(REQ_BODY),
  mode: "cors",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "Accept": "text/event-stream, application/json"
  }
});

// Listen messages
sse.addEventListener("message", (e) => {
  console.log(e.data);
});
```

The first argument `type` in `addEventListener` method is the field `event` of SSE record item.

## RxJS Integration

If you're using RxJS for data management, integration is straightforward. It mirrors the logic in the `SseClient` constructor, except that instead of triggering message events, it calls the `next` and `complete` methods in the `Observable` constructor's arguments.

```typescript
import { Observable } from "@rxjs/observable";

export function fromFetchSse(input: RequestInfo | URL, init?: RequestInit) {
  return new Observable<ServerSentEventItem>(destination => {
    // Merge abort signal
    const controller = mergeSignals(destination, init?.signal);
    let abortable = true;

    // Fetch and raise destination notification handlers
    fetch(input, init).then((response) => {
      const decoder = new TextDecoder("utf-8");
      return handleSse(response, new TextDecoder("utf-8"), item => {
        destination.next(item);
      }).then(arr => {
        abortable = false;
        destination.complete();
        return arr;
      });
    }).catch((err: any) => {
      abortable = false;
      destination.error(err);
    });
  });

  // Return dispose handler
  return () => {
    if (!abortable) return;
    controller.abort();
  };
}

function mergeSignals(destination: Subscriber<ServerSentEventItem>, outerSignal: AbortSignal | undefined | null) {
  const controller = new AbortController();
  const { signal } = controller;
  if (!outerSignal) return controller;
  if (outerSignal.aborted) {
    controller.abort();
  } else {
    const outerSignalHandler = () => {
      if (signal.aborted) return;
      controller.abort();
    };
    outerSignal.addEventListener("abort", outerSignalHandler);
    destination.add(() => outerSignal.removeEventListener("abort", outerSignalHandler));
  }

  return controller;
}
```

Following is the code about usage.

```typescript
const sse = fromFetchSse(SSE_API_URL, {
  method: "POST",
  body: JSON.stringify(REQ_BODY),
  mode: "cors",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "Accept": "text/event-stream, application/json"
  }
});

// Subscribe SSE
sse.subscribe((e) => {
  if (e.event === "message") console.log(e.data);
});
```
