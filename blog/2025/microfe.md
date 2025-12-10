# 微前端实现的另一个思路

Micro-frontends is a pattern that breaks down various sub-businesses into corresponding independent frontend packages, which are then loaded and rendered by the main frontend application as needed. To minimize mutual interference, these loaded independent modules are securely isolated from each other and can be independently maintained and developed.

Nowadays, there are numerous micro frontend solutions. Here, I would like to introduce a new implementation approach, which has some connection to the early architectural design of Azure Portal that I was involved in during the early 2010s.

## Background

Micro-frontends draw inspiration from the concept of microservices in the backend, and its development is closely intertwined with the explosive growth of the frontend domain.

### Remarkable but Brief Development

Looking back, you’ll realize that the development of Web front-end has actually not been very long. Both HTML and W3C were born in the 1990s. After Netscape engineers invented JavaScript in 1995, although people foresaw a bright future for front-end web pages, for quite a long time, it remained in what now seems like a rather primitive state. Dynamic pages were mostly rendered using server-side rendering (SSR) techniques. It wasn’t until 1999, when Microsoft integrated the `XHR` component (originally provided as the `XMLHTTP` ActiveX object) into Internet Explorer, that basic data interaction between the front-end and back-end became possible. Later, the Web 2.0 wave popularized this front-end and back-end interaction model, bringing front-end rendering technology to the forefront.

Meanwhile, the MVVM technology (including concepts like two-way binding) introduced in Composited WPF for client-side development was later brought into the Web front-end through the Knockout library. This allowed for the decoupling of data and views while enabling rapid view generation based on data and achieving componentization. Subsequently, more comprehensive and sophisticated frameworks like Angular, React, and Vue emerged, introducing concepts such as one-way data flow, page routing, virtual DOM, and more. These advancements made the implementation of SPA (Single Page Web Applications) much easier.

### Full of Challenges

However, as front-end pages have grown increasingly large and comprehensive, a single front-end package now often encompasses a multitude of business functionalities. The downside of this is that the package size has become larger, loading times longer, and collaboration among teams supporting these various functionalities has become increasingly difficult due to the growing complexity of engineering. Additionally, specific scenarios, such as the integration of third-party businesses, further complicate matters. Ultimately, the demand for separating business functionalities and managing them centrally through the main Web application, with on-demand loading, has emerged within the front-end community.

The solution to this challenge is micro-frontend.

### Solutions

In today's real world, micro-frontend technology is applied in many scenarios, emphasizing independence, composability, autonomy, and isolation, albeit with some trade-offs based on existing web frontend technologies.

Thanks to the support of modern frontend modularization and routing, independent development of respective business modules is not a challenging task. By adhering to the frontend main application framework's declaration conventions for modules, registering and deploying them separately, the main application framework can determine and select the corresponding specific business modules based on user actions or page entries. This is achieved through dynamically inserting script packages for on-demand loading. This part also constitutes an essential aspect of package management in micro-frontend frameworks.

The loaded package is usually assigned a predefined element, i.e., a business view slot, for the frontend logic of the business module to operate. This includes creating child elements and associating event responses. The specific frontend logic is implemented based on the respective business logic, enabling each module to function independently and decoupling the different business modules from one another. Some frontend frameworks may introduce additional tools and constraints based on practical scenarios to facilitate better integration of business frontends under certain standards, but these are targeted optimizations. Overall, micro-frontends impose relatively lenient rules on the business frontends they integrate, even allowing them to choose their own frontend frameworks.

Since frontends typically use webpack or similar methods for bundling, styles and inline SVGs can be integrated into the corresponding frontend package through such engineering approaches. Some frameworks impose conventions on CSS, such as requiring namespaces (e.g., based on the BEM methodology) to prevent style pollution across businesses, as these CSS styles exist at the page level. In addition, using Shadow DOM enables better management of child elements and isolation of CSS, making it another viable solution.

For JavaScript runtime, to prevent mutual interference caused by global object sharing, micro-frontends often introduce sandbox mechanisms. For example, after loading a frontend package, its contents are placed into a context where objects like `window` are rewritten before triggering execution. Below is an example of such code. These patterns may still have areas that require consideration during implementation.

```javascript
const sandboxStore: Record<string | symbol, unknown> = {
  // Declare and implement the global objects and functions to replace. They are omitted here.
};
function get(target: Window & typeof globalThis, key: string | symbol) {
  return sandboxStore[key] || window[key as any];
}
function set(target: Window & typeof globalThis, key: string | symbol, value: any) {
  sandboxStore[key] = value;
  return true;
}
function has(target: Window & typeof globalThis, key: string | symbol) {
  return true;
}
const sandboxWindow = new Proxy(window, { get, set });
const sandboxContext = new Proxy(window, { get, set, has });
export function handle(fn: string) {
  (new Function("window", "globalContext", `
    with (globalContext) {
        ${fn}
    }
  `))(sandboxWindow, sandboxContext);
};
```

## First Version of Azure Portal

让我们又回到从前，在那个 VS Code 还没问世的很早但其实也没那么早的年代。

### iframe

在早期，受制于 SSR 彼时状态和前端组件封装等因素限制，`iframe` 曾大放异彩，其既具有隔离性，又具有同页面一定权限下的互访问性，方便前端实现一些具有局部刷新能力的效果。随着 SSR 的增强，`iframe` 技术适用的场景也就急剧缩小；而当前端渲染框架的日趋完善，尤其是 SPA 的出现，`iframe` 通常只存在于极少数的特殊场景。

从某种程度上说，`iframe` 的安全隔离性质，其实很符合微前端述求的。然而，它是一个较重的方案；且在未经特殊处理的前提下，其自身在父页面中是不支持流式等自适应布局的；以及内嵌页在呈现上的边界过于固化，而限制了诸如弹窗浮层一类希望跳出当前内嵌页在全局进行呈现。最终，这套方案在微前端方案中并不常见。

### MVVM

微软的 Azure Portal（既微软公有云控制台管理站点）的最早期版本，其微前端方案其实底层是基于 `iframe` 的。不过，并不是将这些子业务放进 `iframe` 来进行页面呈现的传统方式。那时 React 尚未问世，Azure Portal 前端基于 Knockout 的 MVVM 模式开发，这种模式是采用将 data model (Model) 和 view template (View) 两部分作为基本构成部分，并通过对 data model 在内部包装成 View Model，同时根据业务赋予一些监听响应，从而完成对界面渲染和交互的描述。该模式与 Angular 和 Vue 较为类似，只是功能没那么丰富。

具体说来，

- 我们先从后端和上下文中获取和整理相关数据，这些数据本质上是一些 JSON 对象。
- 可以将这些对象通过一个方法，转化为 view model。这个转化也称为 wrap，只是将相关属性替换为访问器，以在 setter 逻辑内部实现对通知事件的调用。（实际上，Knockout 因实现的年代久远，并未通过使用 `Object.defineProperty` 或类似方式来重新实现访问器，而是颇有激进侵入性地将属性变更为方法，从而在调用属性时改为调用同名方法。）
- 我们编写一些View template，这些模板是一些具有特殊属性和辅助元素的 HTML 模板元素。模板里描述了其中一些元素呈现文本或特定属性，与view model之间的映射关系，包括支持进行一些转化；模板也描述了一些诸如循环和判断等相关的逻辑，用于控制视图内部细节的具体生成。这个模板可以是表述该 HTML 内容的字符串形态。
- View template中的元素也可以注册一些自定义事件，这些事件也会关联在绑定的view model中。
- Knockout 引擎接受view model和View template，从而生成对应的视图，并自动建立一些监听，从而在view model变化时，通知对应的视图进行局部变更，同样，视图的一些变更，最终也可能会反映到view model中。如果直接传入 data model，那么会在引擎内自动进行一次数据视图的转化，从而确保整个双向绑定逻辑的顺利完成。

```html
<ul data-bind="foreach: list">
    <li>
        <span data-bind="text: name"></span>
        <span data-bind="text: subname"></span>
    </li>
</ul>
```

```typescript
ko.applyBindings({
  list: [
    { name: "A", subname: "alpha" },
    { name: "B", subname: "bravo" }
  ]
});
```

以上逻辑并不复杂，现代前端框架拥有更为先进和丰富的能力来实现更多的效果。但这种方式，却对于实现一个完美微前端却有非常显著的优势。在 Azure Portal 中，通过对上述view model中监听通知进行调整，使通知被路由映射到一个统一的订阅汇聚模块中，同时对这些view model进行标识。嗯，听起来有那么一点像 Redux。最终，当view model发生变化时，无论是来自视图还是来自外部，都会经过这个统一的订阅汇聚模块。自定义事件由于也是关联在view model中的，因此相关事件也被进行类似的路由处理。那么为什么要创建这样一个统一的订阅汇聚模块呢？

### iframe with New Technology

在 Azure Portal 的前端主应用中，根据用户对业务的访问，会从注册的业务配置清单中读取对应的信息，该信息包含一个线上网页地址，该地址可以是不同域名，即允许外部第三方页面。这个页面是个标准的 HTML 页面，但里面不需要呈现任何有业务信息的视图，因为这个页面会在一个肉眼看不到的 `iframe` 中加载。这个页面中会被要求引用 Azure 官方提供的一套 SDK，该 SDK 即包含上述机制，以及从 Azure Portal 前端主应用中通过 `onmessage` 的方式获取当前会话的上下文信息。业务需要依托该 SDK 用 JS 实现自身的业务，包括前后端的数据交互。由于页面本身无需与 Azure Portal 同域名，因此可以是业务所有者（哪怕是外部第三方）的域名，考虑到彼时除了 JSONP 外并无更好的 CORS 方案，由此还顺便解决了跨域问题，但即便是今天，这也对后端收拢跨域安全问题有一定的帮助。业务在获取到相关数据后，转化成预期View template所需view model，并附上可能需要的任何事件，以及注册好对应的监听和处理逻辑，并在这些事件和其它流程中，将相关数据发送回给后端，而后又根据业务逻辑将后续数据拿到前端并转成view model，以此往复，构成一整套前后端数据交互。

这些数据以及最终呈现的view model，似乎并不会其任何作用，因为业务的内嵌页并不会被呈现。但业务依旧需要将View template一并提供给 Knockout，或者更确切的说，是给 SDK。然而，SDK 获取到这些view model和View template后，并不会在当前页面进行渲染，而是通过 post message 机制，发给宿主页面，也就是前端主应用。这两组数据，其中view model会转化为普通 JSON，而View template会转化为字符串形式，以确保在底层是能够真实发送的。前端主应用首次收到后，将view model对应的 JSON 重新转化为view model，连同View template，一起渲染到预期呈现该业务的视图插槽中，于是，在前端主应用中，按照业务的预期，呈现出了界面。这界面是前端主应用渲染和控制的，业务页面依然在 `iframe` 中，无权直接访问。

当该界面元素发生变化时，受 MVVM 影响，其会反应到view model中，而view model中相对应属性的变化，则会经过前端主应用的统一订阅汇聚模块，随后又通过 post message 的方式，发送回给对应的 `iframe`，并由业务页面中引入的 SDK 内的统一订阅汇聚模块响应，最终结果是业务页面中原本的view model对应的属性被触发了更新，并进而引发业务页面中对该属性变化的监听的业务逻辑和进一步的其它联动。同样的，由业务页面中引发的view model的属性变动，其事件通知也会经过业务页面中的统一订阅汇聚模块，而后又通过 post message 的方式发给前端主应用中的统一订阅汇聚模块，并精准更新了前端主应用中该业务的view model副本，并进而触发对应的真实视图更新，于是用户看到了页面内容的局部更新。而用户的操作引发的普通事件，也通用通过前端主应用相关的view model注册方法所捕获，并通过该链路最终抵达业务页面中原始的事件响应函数。所有的界面交互，经由这前端主应用和业务页面 SDK 串联起来，前端主应用的视图，与业务页面的view model及其背后的后端服务，隔空联动了起来。

![Two way data bindings](./images/pic-12-mfe-21.webp)

其中，post message 传递的内容，主要是view model的变动部分，以及可能的新使用的View template，反向传递的则是订阅信息。

## Back to Today

以史为镜可以知兴替，也不一定是兴替这么夸张，但或许可以洞悉一下当下可能的可能。

### Difference

十多年后的今天，伴随着新式前端框架的出现和发展，情况似乎有所不同。

- 旧有的相对简单的 Knockout 模式，在 React、Angular 和 Vue 等为主的现代框架模式下，似乎已经行不通了，因为View template与数据之间的关系变得更为复杂，且原先View template中的一些逻辑，一部分也逐渐更倾向代码逻辑控制，最终的结果是，View template无法转化为字符串的表达方式，从而无法跨越 `iframe` 进行传递。
- 而另一方面，浏览器内建支持的一些前端基础能力也得到了大量补充，以及一些其它前端技术的应用，使得我们也有一些手段，可以以更优雅高效的方式，实现等效结果。

那么，我们来尝试着做一些设想，看还能不能用更现代的方式，在更现代的前端基建上，实现更为彻底的微前端。以下是建立在今天已有的技术之上的探讨；未来，随着技术的进一步发展，可能会有更多基础能力和工具来做到更好的支撑，从而更简化这些实现过程，但不在本文范围中。

### Virtual DOM

让我们以 React 为例吧。

```tsx
interface NameValueComponentProps {
  name: string;
  value: string[];
}
function NameValueComponent({ name, value }: KeyValuePairComponentProps) {
  return <dl>
    <dt key={"name"}>{name}</dt>
    {
      value.map((item, i) => (
        <dd key={`item-${i}`}>{value}</dd>
      ))
    }
  </dl>;
}
```

我们通常会写一些函数式组件，里面通过 `return` 返回一些 JSX/TSX 语法的Virtual DOM 树，其结构通常是由一系列代码逻辑控制生成的，在不考虑之间传递源码的前提下，看起来不太可能转为字符串。

然而，React 内部会将 JSX 语法中生成节点的部分替换为调用 `React.createElement` 函数，并在内部构件一个基于 JavaScript 结构的信息，存储这些节点，此谓之Virtual DOM。而后，在下个渲染周期时，会将这些Virtual DOM 的变更，反映到真实 DOM 中。实际上，为了提升性能，React 在执行更新时，会依据包括 diff 在内的一些策略，只提取有改动的部分分批依此执行。

在这里其实可以看到，React 内部在执行渲染的过程，其实是关于Virtual DOM 树的变更，此树本质上是一个结构体，结构体中包含了Virtual DOM 的类型和 props 等信息，而变更部分则主要是树中的局部组成部分，即与变更有关的那一部分，再外加一些变更状态信息等，所以也是一个描述变动内容的结构体。通过遍历并复制该变动结构体中的成员，将其转化为一个简化副本，再此过程中将其内部包含的诸如函数等非简单结构可转化为唯一标识，随后就能将这个副本进行序列化并进行 post message 传输了。

在前端主应用中，可以监听这个事件，并在其内部为此业务预留的 React 组件插槽内，即可执行具体的 render 操作了。

这个过程和前面提到的早期 Azure Portal 的工作原理类似，只是 Knockout 换成了 React，其内部传递的信息由View template和view model，变为了 React 内部的变更描述结构体。在业务前端中，React 不再需要在真实 `document` 上进行绘制，该流程被前端主应用执行了，但其它流程保持不变。在前端主应用侧，React 组件所触发的 state 等变动，也以类似机制，通过 post message 的方式传回到业务前端引入的 React 的处理流程中，最终可能会触发业务前端中 React 组件中的响应逻辑部分，并可能进一步触发新的渲染，再继续以前述流程，在前端主应用中该业务对应的组件中渲染。

### Service Worker

然而，业务前端不再需要放在 `iframe` 中了。浏览器中，除了一些界面控制外，`iframe` 示例本质上和新起了一个网页 Tab 区别不是很大，包含了 JS 执行和渲染等多套逻辑。既然业务前端在当前的进程中无需真实触发渲染，那么至少 `iframe` 中对应的页面渲染，或者说 `document` 部分，其实是不需要的。实际上，现代浏览器也提供了这样一种无界面但能独立运行 JS 的模式。

这就是 service worker。

其与主界面之间的信息交互机制中，也依然支持 post message 这种形式。因此，前面 React 模式中，业务前端和前端主应用之间的通信依旧能正常工作。只不过，业务前端是以业务 Worker 的形式驻留在浏览器中，非常纯粹。由于 service worker 也是运行于独立进程的，因此与前端主应用所在的进程之间，不会存在因负载原因而互相线程级阻塞对方的现象。从按需加载角度看，创建 service worker 也较为简便和可控，因此微前端包管理也会相对容易实现。

![Flow in React](./images/pic-12-mfe-23.webp)

其中，post message 传递的内容，主要是Virtual DOM（包括状态在内）的变动部分，反向传递的则是事件信息。当然，由于多了一层基于 post message 的跨进程中转的过程，一些方面上的性能肯定是比原始 React 模式效率较低。但这套方案，的确在安全隔离等方面的优势是与生俱来的。

### Shadow DOM

那么样式如何处理呢？可以继续使用当下成熟的方案，包括约定式命名空间，或者使用 Shadow DOM。

如果使用 Shadow DOM，那么，可以在前端主应用中，定制一个统一的 React 组件，并封装成 Shadow DOM，此即业务视图插槽的根节点。该 Shadow DOM 元素及其内 React 组件，接受经前端主应用收到 service worker 并按业务映射路由后的通知，包括起始时样式等初始化信息的接入并组装，以及后续 React Virtual DOM 变更事件的实际 UI 层触发执行。由此，界面渲染部分也都被完整进行了隔离，其隔离的封装及外部交互，均由前端主应用负责实施，而业务部分全都在 Shadow DOM 内部，不会与外部产生干扰。

### What's Next

然而，有颇为现实的问题，就是理论上能行，但 React 似乎并没有开放这样一个入口，允许我们对Virtual DOM 及 state 响应等逻辑进行接管控制，从而将整体链路串联到 work service 与页面分离同步的设计方案上。似乎，只有提 MR 直接修改 React 内部，在其自身才能实现这套机制，所谓 React 原生微前端技术是也。

那么其它框架怎么办？

- 对于 Angular，可在视图层和view model之间进行隔离处理。
- 对于 Vue，其也有 Virtual DOM，可以在此进行处理。

当然，这中间肯定还有许多针对性的适配工作要做，而且，似乎这些框架也都需要各自进行处理。

除此之外，此微前端方案有个限制，即存在前端框架绑定的问题：业务前端包必须与主应用共用相同的前端框架，且主应用的版本不能低于业务（除非未用到新特性）。当然，这个问题或许在现实中还好解决，毕竟它还有许多明显优势，即真的做到了前端逻辑的隔离：JS 运行于独立进程；全局对象互不影响；样式隔离；按需加载，便捷完善的微前端包管理。而且，这些隔离还是原生的，充分利用浏览器已经存在的技术，非常纯粹。
