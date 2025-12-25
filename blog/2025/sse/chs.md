## 背景

JavaScript 请求后端接口，最常见的是 `fetch`；再更早之前，则是 XHR 和 JSONP。随着大语言模型（LLM）的流行，为了应对服务器端生成的内容是逐步产生且整体耗时过长的问题，称为 Server-Sent Events（简称 SSE）的流式传输模式便越来越流行。这种模式下，服务器端以字符串的形式，按批次将内容进行增量输出，而前端（或客户端）则依据每个批次进行读取解析，并以此更新界面元素，完整的数据亦可依照约定进行整合生成。

在现行标准中，其实 Web 前端也是有一套读取 SSE 的 API 的，那便是 `EventSource`。该类型在初始化时可传入一个 URL 地址，浏览器就会去进行请求，并通过注册的事件将获取的消息反映在回调中。

```javascript
const sse = new EventSource(SSE_API_URL);
sse.addEventListener("message", (e) => {
  console.log(e.data);
});
```

然而，该 API 只能执行 `GET` 请求。对于上述 LLM 的例子，更多的是 `POST`，使用这个就无法实现了。本文将介绍如何自行实现一个完整能力的 SSE 客户端，通过 `fetch` 接口发起请求，以预期获取 SSE 格式并进行解析。

## 结构和解析

SSE 返回值内容，本质上是一个字符串，其 Content-Type 值为 `text/event-stream`。其内容表示的是一个数组，数组中各元素默认支持以下几个字段，全部为可选（即非必填）。

- `event` _字符串_：当前消息项的类型。
- `data`：消息项正文（负载）。
- `id` _字符串_：消息 ID。
- `retry` _整数_：重试间隔秒数。
- （空字符串作为键名）_字符串_：不重要的注释。

其中，

- 以上各字段的类型，均不做转义和包装处理。
- `data` 的内容可以是普通文本，也可以是 JSON，还可以是其它格式，具体以业务约定为准，SSE 标准中并未做确定。
- `event` 为空时，可视为值为 `message`。

这个结构并非采用 JSON 形式，而是与 YAML 有点相似但又不全相同的格式。其各字段是通过 `\n` 换行进行分割，属性名和值通过半角冒号 `:` 隔开，其中 `data` 如果存在多行（即其内容中包含了字符 `\n`），那么并不是通过转义实现类似效果，而是通过设置多个 `data` 字段，最终将这些字段整合为一个多行字符串（即用 `\n` 拼接）。

我们据此设计一个类，如下，其接受一个字符串，字符串的内容即为 SSE 的一个消息项，在构造函数中解析并存储于私有成员字段后，通过对外暴露对应的各属性提供读取功能。

```typescript
export class ServerSentEventItem {
  private source: Record<string, string>;
  private dataParsedInJson: Record<string, unknown> | undefined;

  constructor(source: string) {
    this.source: Record<string, string> = {};

    // 对输入的字符串进行解析：
    // 1. 按换行分割；2. 然后读取半角冒号前后的键值；3. 存入记录池中。
    source.split('\n').forEach(line => {
      const pos = line.indexOf(':');
      if (pos < 0) return;
      const key = line.substring(0, pos);
      const value = line.substring(pos + 1);
      if (!this.source[key] || (key !== 'data' && key !== '')) this.source[key] = value;
      else this.source[key] += value;
    });
  }

  // SSE 的标准字段。
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
    return this.source[''];
  }
  get retry() {
    return this.source.retry ? parseInt(this.source.retry, 10) : undefined;
  }

  // 经 parse 后的 data
  dataJson<T = Record<string, unknown>>() {
    const data = this.source.data;
    if (!data) return undefined;
    if (!this.dataParsedInJson) this.dataParsedInJson = JSON.parse(data);
    return data as T;
  }

  // 字段原始值读取
  get(key: string) {
    return this.source[key];
  }
}
```

这些只读属性返回了 SSE 标准字段，同时还提供 `get` 方法用于获取各字段原始值和非标准定义的其它字段的值，以及考虑到 `data` 在许多情况下预期的都是一个 JSON 内容，此处 `dataJson` 方法用于进行 Parse 处理并进行缓存。

## 流式处理

一个 SSE 的请求结果，通常会是一连串的该类型实例，这些实例可以通过事件通知外部，以供业务读取。但如前面所言，从服务器端过来的这些信息本质上是一节一节的字符串。

通过 `fetch` 接口的返回值，我们可以从其 `body` 中获取其内容流的读取器实例。然后经由一个循环，不停调用读取器的 `read` 方法，以获取其是否已完成的状态，以及当前值。这个值需要用解码器来转化成最终字符串，因此还需要一个 `TextDecoder` 字符串解码器。理论上每次读取的这些值应该刚好就是一个 SSE 的消息项，但在设计时，还是为了以防万一，我们都会将读取的字符串进行存储，然后再去判断其中是否存在单个消息项，甚至有可能会是多个。

SSE 规范中定义其中项与项之间通过连续两个 `\n` 换行符（即 `\n\n`）进行相隔，因此我们只需要以此作为关键词来进行拆分即可。当从缓存中读取并拆分出完整的这些项，便可调用之前实现的 `ServerSentEventItem` 类来解析，并最终触发对应的事件。

```typescript
async function handleSse(response: Response, decoder: TextDecoder, callback: ((item: ServerSentEventItem) => void)) {
  // 初始化
  if (!resp.body) return Promise.reject("no response body");
  const reader = resp.body.getReader();
  let buffer = "";
  const arr: ServerSentEventItem[] = [];

  // 循环读取
  while (true) {
    const { done, value } = await reader.read();
    if (done) { // 结束处理
      convertSse(buffer, arr, callback);
      this.internal.readyState = EventSource.CLOSED;
      return arr;
    }

    // 先将解码出的内容存入缓存
    buffer += decoder.decode(value, { stream: true });

    // 依据分隔符进行拆分并判断是否存在已完整输出的项
    const messages = buffer.split('\n\n');
    if (messages.length < 2) continue;
    buffer = messages.pop() || '';

    // 将所有拆分后的完整项进行解析并作为事件抛出
    messages.forEach(msg => {
      convertSse(msg, arr, callback);
    });
  }
}

function convertSse(msg: string, arr: ServerSentEventItem[], callback: ((item: ServerSentEventItem) => void)) {
  if (!msg) return;
  const sse = new ServerSentEventItem(msg);
  arr.push(sse);
  callback(new MessageEvent(sse.event, { data: sse }));
}
```

## 请求和封装

有了 `Response` 内容流式解析后，还有很关键的一步，即对后端相关接口的请求。在此，我们使用标准的 `fetch` 接口，并以流的方式对其返回内容（即 `body`）进行读取，然后转为 UTF-8 进行解析。为了降低使用者的学习成本，我们的输入输出均仿效现有模式。

- 整体是一个类，其结构与现有 GET 特供版 SSE 内置实现 `EventSource` 保持一致，通过事件注册的形式对外提供响应，因此其实际与 `EventSource` 一样都继承自专门用来收发事件的 `EventTarget` 类。
- 构造函数入参形式和 `fetch` 保持一致，并随后将这些入参传入 `fetch` 接口中，拿到返回值的内容，然后可以调用其中的 `getReader` 方法获取一个可对内容以流的形式读取的实例。

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
    // 提供 on 系列事件回调
    this.addEventListener("open", ev => {
      if (typeof this.onopen === "function") this.onopen(ev);
    })
    this.addEventListener("message", ev => {
      if (typeof this.onmessage === "function") this.onopen(ev);
    })
    this.addEventListener("error", ev => {
      if (typeof this.onerror === "function") this.onopen(ev);
    })

    // 读取 URL
    if (typeof input === "string") this.internal.url = input;
    else if (input instanceof URL) this.internal.url = input.toString();
    else this.internal.url = input?.url;

    // 使用 fetch 发送网络请求
    this.internal.promise = fetch(input, init).then(r => {
      // 状态准备
      this.internal.readyState = EventSource.OPEN;
      this.dispatchEvent(new Event("open"));

      // 流式处理
      return handleSse(resp, new TextDecoder("utf-8"), item => {
        this.dispatchEvent(new MessageEvent(item.event, { data: item }));
      });
    }).catch(err => { // 异常处理
      this.internal.readyState = EventSource.CLOSED;
      this.dispatchEvent(new Event("error"));
    });
  }

  // 预设的 on 系列事件回调
  onopen: ((ev: Event) => any) | null;
  onmessage: ((ev: MessageEvent) => any) | null;
  onerror: ((ev: Event) => any) | null;

  // 获取一些基本信息
  get url() {
    return this.internal.url;
  }
  get readyState() {
    return this.internal.readyState;
  }

  // 用于异步等待完成
  wait() {
    return this.internal.promise;
  }
}
```

以上实现，在对象被初始化后，便会立即触发 `fetch` 以创建连接。在 JavaScript 世界，由于脚本运行于单线程中，故其实际的触发后通过 `Promise` 注入的回调不会被立即执行，而是会等待当前协程（fiber / 线程执行片段）结束后才会被调用，也就是说，在下个事件周期到来前，也就是按顺序执行的后续逻辑中，通过此实例 `addEventListener` 注册的事件函数都会被完整触发，这种情况下不会出现前序事件遗失的情况。以上便完成了核心功能的实现。

## 使用

假设我们要通过 `POST` 请求一个特定的 Web API，并预期其返回的是 SSE，那么只需按如下代码调用即可，非常简单和熟悉。

```javascript
// 创建实例并触发执行
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

// 监听事件注册回调
sse.addEventListener("message", (e) => {
  console.log(e.data);
});
```

其中 `addEventListener` 方法的第一个入参 `type` 即为 SSE 消息项的 `event`。

## RxJS 集成

假如你用的是 RxJS 来管理数据，那么封装也非常简单，与前面的 `SseClient` 构造函数中的逻辑类似，只不过在原触发消息事件的地方换成 `Observable` 构造函数入参中对应的 `next` 和 `complete` 方法调用。

```typescript
import { Observable } from '@rxjs/observable';

export function fromFetchSse(input: RequestInfo | URL, init?: RequestInit) {
  return new Observable<ServerSentEventItem>(destination => {

    // 以下是对终止操作的例行整合处理
    const controller = new AbortController();
    const { signal } = controller;
    let abortable = true;
    const { signal: outerSignal } = init;
    if (outerSignal) {
      if (outerSignal.aborted) {
        controller.abort();
      } else {
        const outerSignalHandler = () => {
          if (!signal.aborted) {
            controller.abort();
          }
        };
        outerSignal.addEventListener('abort', outerSignalHandler);
        destination.add(() => outerSignal.removeEventListener('abort', outerSignalHandler));
      }
    }

    // 发出请求并处理后续返回
    fetch(input, init).then((response) => {
      const decoder = new TextDecoder('utf-8');
      if (!response.body) return Promise.reject("");
      return handleSse(response, new TextDecoder("utf-8"), item => {
        destination.next(item);
      }).then(arr => {
        destination.complete();
        return arr;
      });
    }).catch((err: any) => {
      abortable = false;
      destination.error(err);
    });
  });
}
```

使用方式如下。

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

// 监听事件注册回调
sse.subscribe((e) => {
  if (e.event === "message") console.log(e.data);
});
```
