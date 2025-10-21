# WebNN —— 浏览器也能原生运行 AI

Web Neural Network API 是一套 Web 友好的 W3C 标准，其基于浏览器内置 JS API 的方式，提供与操作系统和底层硬件无关的跨平台抽象层，利用 GPU、CPU、NPU 或其它专门构建的 AI 加速器，方便前端研发来构建基于人工智能的网页应用。

## 概述

- https://www.w3.org/TR/webnn/

> The Web Neural Network API defines a web-friendly hardware-agnostic abstraction layer that makes use of Machine Learning capabilities of operating systems and underlying hardware platforms without being tied to platform-specific capabilities. The abstraction layer addresses the requirements of key Machine Learning JavaScript frameworks and also allows web developers familiar with the ML domain to write custom code without the help of libraries.

### 用处

WebNN 通过面向 JS 提供了一组标准化的 API，方便 Web 前端开发者直接在用户浏览器中创建、编译和运行神经网络，或直接加载并运行已有 AI 模型，以实现各项端 AI 能力。

- 人员检测（Person detection）
- 人脸识别（Face detection）
- 图形框选（Semantic segmentation）
- 骨骼检测（Skeleton detection）
- 风格迁移（Style transfer）
- 超分辨率（Super resolution）
- 智能插帧（MEMC）
- 抽取字幕（Image captioning）
- 机器翻译（Machine translation）
- 噪声抑制（Noise suppression）

只要模型尺寸合适，各类 AI 模型都是可以在 WebNN 上运行的，或者直接在浏览器中执行具体的功能。

### 运行方式

WebNN 可运行于 Web 前端所在的本地设备之上。对于客户端所用不同操作系统，其运行于适配的不同 AI 框架之上，并与 ONNX 拥有较好的集成能力。

![架构图](./images/webnn-arch.jpg)

具体来说，由 WebNN 作为中间统一适配层，对上层提供一致性访问接口，向下根据不同操作系统路由调用对应的原生 API 接口，而再由这些系统级框架调用硬件层的 CPU、GPU 或 NPU 执行具体计算，以此在浏览器内提供和原生机器学习近似的性能。

| 操作系统 | 原生机器学习框架 | 原生框架实现者 |
| ------------ | ------------ | ---------- |
| Windows | [DirectML](https://learn.microsoft.com/zh-cn/windows/ai/directml/dml) | 微软 |
| macOS/iOS/iPadOS | [CoreML](https://developer.apple.com/documentation/CoreML) | 苹果 |
| Android | [NN API](https://developer.android.google.cn/ndk/guides/neuralnetworks?hl=zh-cn) | 谷歌 |
| Linux (on Intel® Core) | [OpenVINO](https://www.intel.cn/content/www/cn/zh/developer/tools/openvino-toolkit/overview.html) | 英特尔 |

另外，在早期、非 Windows 设备上，通过 WebGL graphics API 构建的 WebNN API polyfill，以兼容的方式来实现对应能力。现在，许多基于较新 Chromium 的浏览器（如 Microsoft Edge）都已对其进行支持。由于 WebNN 是由微软实际驱动并在 Edge on Windows 上优先开发的，因此目前（2024年11月）在该操作系统和浏览器搭配上体验效果更好。

而在 WebNN 之上，通过浏览器标准化的 JS API 所提供对应能力的访问方式，则可以方便使用一些主流 AI 框架来运行具体业务逻辑。例如可以使用 [ONNX runtime web](https://onnxruntime.ai/docs/tutorials/web/) 并加载对应的模型来完成后续的推理。

ONNX（Open Neural Network Exchange）是一套 AI 框架和标准描述计算图格式，包含了许多自上层到下层多方面的 API，还可以作为中间层在 PyTorch 和 TensorFlow 之间相互转化和调用，同时支持本地、内部网络、云端以及 hybrid 模式，因此可将本地模型和云端模型按照程序设计进行混合式运行，以满足多样化的效果。

### 优势

- __性能优化__：通过利用 DirectML 和对应的其它框架，WebNN 使 Web 应用和框架能够利用每个平台和设备的最佳可用硬件和软件优化，而无需复杂地特定于平台的代码。
- __低延迟__：浏览器内的推理使本地媒体源（如实时视频分析、人脸检测和语音识别）能够使用新的用例，而无需将数据发送到远程服务器并等待响应。
- __隐私保护__：用户数据保留在设备上并保护用户隐私，因为 Web 应用和框架不需要将敏感信息或个人信息上传到云服务进行处理。
- __高可用性__：离线情况下，在初始资产缓存后不依赖网络，因为即使互联网连接不可用或不可靠，Web 应用和框架也可以在本地运行神经网络模型。
- __低服务器成本__：在客户端设备上进行计算意味着不需要服务器，这有助于 Web 应用减少在云中运行 AI/ML 服务的运营和维护成本。

对于直接以 Native 方式开发的端 AI（或混合 AI）相比，通过 WebNN 可以做到更快速的程序逻辑更新迭代，以及获得更为显著的跨平台开发优势，即不用为每个平台分别进行开发，通过浏览器及其内置的 WebNN 底层适配层来抹平不同平台之间的差异，最终只需无差别开发一份代码并部署即可。

而对于在线（云端）AI，其在隐私保护和低延迟有明显优势，通过设定 JS 程序和模型缓存策略，还可以降低服务器成本并控制带宽成本。另外，对于本身就是 Web-based 客户端或 B/S 架构的 AI 程序，其前端界面交互部分本身是可以复用的，只需替换其浏览器后端对 AI 能力调用的实现，即可快速完成能力迁移。

在没有此项技术前，如果要在 Web 前端增加 AI 能力，除了基于在线（云端）AI 外，其实另一种方式是通过引入 wasm 的方式实现，然而 wasm 开发较重、与 JS 交互相对不是那么紧密友好，且由于其基于本机能力故依然存在跨平台问题，加上 wasm 运行于沙盒中会导致其能力和性能皆不如原生，且需额外挂载 AI 平台从而增加启动延迟和网络负担，这些都是其不如 WebNN 的方面。

| 项 | | 端 AI | 在线 AI | Wasm | WebNN |
| ---------- | :--: | :----: | :----: | :----: | :----: |
| 推理运行位置 | - | 本机 | 云端 | 本机 | 本机 |
| 性能 | ☆ | 高 | 高 | 低 | 高 |
| 延迟 | ☆ | 低 | 高 | 低 | 低 |
| 跨平台 | ☆ | 否 | 是 | 否 | 是 |
| 更新与分发 | ☆ | 较重 | 方便 | 方便 | 方便 |
| 服务器成本 | | 低 | 高 | 低 | 低 |
| 隐私风险 | | 无 | 存在 | 无 | 无 |
| 弱网断网可用性 | | 是 | 否 | 是 | 是 |
| 研发复杂性 | | 分平台 | 低 | 高 | 低 |

## 开发

WebNN 最终体现为浏览器内置的一套 JS API 集合，通过暴露类和函数的方式提供，从调用方式和桥接实现角度上看，与其它浏览器内置 JS API 没有任何技术上的区别。

### 常见类型

> Common-used classes and interfaces

- `MLGraph`：编译后的计算图，将源、路由、模型、转换器和接收器等节点有机串联起来。
- `MLOperand`：计算图运行中将多个操作进行整合的操作过程。
- `MLTensor`：张量，一种数据容器，用于作为模型输入参数和输出结果。
- `MLContext`：所有 AI 操作的通用上下文，可以基于此创建组件，用于数据准备、特征工程、训练、预测和模型评估，以及追踪等附加功能。
- `MLGraphBuilder`：简单说来，可以被认为是 `MLGraph` 和 `MLOperand` 的工厂。

### ONNX

[Open Neural Network Exchange](https://onnx.ai/) 支持市面上大多数主流 AI 框架，功能强大，简化并统一了许多调用方式，其封装格式也更为通用，是现代许多 AI 开发的利器。

ONNX runtime web 是 ONNX 的 JS 前端版，已为 WebNN 做了充分适配，因此只需引入该前端框架，并基于此进行开发即可。

```bash
npm i onnxruntime-web
```

> https://onnxruntime.ai/docs/api/js/index.html

另，ONNX 还有适用于以下场景的 JS 版本。

| 其它适用场景 | npm |
| ---------- | ---------- |
| Node.js 服务器后端（或中间层） | [onnxruntime-node](https://www.npmjs.com/package/onnxruntime-node) |
| React Native | [onnxruntime-react-native](https://www.npmjs.com/package/onnxruntime-react-native) |

### 能力启用

对于 Edge 和 Chrome 浏览器，建议更新至 v130.0 或更高版本，并确保启用以下特性。

```
about://flags/#web-machine-learning-neural-network
```

> Enables the Web Machine Learning Neural Network (WebNN) API. → __Enabled__

## 文生图示例

🌰 我们以接入 Stable Diffusion 1.5 为例，来演示如何使用。

> 微软官网提供了 Image Classification（在图片中识别物品）示例，其较为简单，用到了 [MobileNet v2](https://huggingface.co/docs/transformers/model_doc/mobilenet_v2) 模型，可通过下方链接了解。
>
> https://learn.microsoft.com/zh-cn/windows/ai/directml/webnn-tutorial
>
> 本文选用相对而言更为复杂但也很常见的场景，即基于 [Stability AI 的 SD 文生图](https://github.com/Stability-AI/StableDiffusion)（high-resolution image synthesis with latent diffusion models）来演示，其会用到多个模型，并有一些复杂的数据处理。

### 下载模型

通常情况下，利用 Stable Diffusion 实现文本生成图片的操作，会依此用到以下4个模型。由于实例中采用的 AI 框架是上文提及的 ONNX runtime web 以简化使用和强化跨平台能力，因此可直接使用对应的 ONNX 模型封装格式（.onnx）文件。

> 以下均来自 Hugging Face 上的微软仓库

#### 1. 文本拆分嵌入

| 项 | 值 |
| ------ | -------------------- |
| 名称 | __text-encoder__ |
| 大小 | 235 MB |
| 地址 | https://huggingface.co/microsoft/stable-diffusion-v1.5-webnn/resolve/main/text-encoder.onnx |

通过将人类阅读友好（human-readable）文本转换成 AI 模型能理解的 prompt 的 CLIP 模型，以实现图像绘制信息的描述。

![Text Encoder](./images/ai-text-encoder.jpg)

#### 2. 多层次特征提取和图像分割

| 项 | 值 |
| ------ | -------------------- |
| 名称 | __unet__ |
| 大小 | 1.60 GB |
| 地址 | https://huggingface.co/microsoft/stable-diffusion-v1.5-webnn/resolve/main/sd-unet-v1.5-model-b2c4h64w64s77-float16-compute-and-inputs-layernorm.onnx |

这是一种卷积网络架构图模型（Convolutional networks for biomedical image segmentation），由多层 ResNet 模块串联构成，并在其间添加交叉注意力机制，用于接收额外的文本指令，指导图像生成，其名称由来是因为处理过程形同英文字母 U 如下图，即 contracting path 下采样到 expansive path 上采样的完整过程，故名 U-net。本例中我们预计会进行25轮，以将随机噪声转化为图像隐特征。

![UNet](./images/ai-unet.jpg)

#### 3. 变分自编码器

| 项 | 值 |
| ------ | -------------------- |
| 名称 | __vae-decoder__ |
| 大小 | 95 MB |
| 地址 | https://huggingface.co/microsoft/stable-diffusion-v1.5-webnn/resolve/main/Stable-Diffusion-v1.5-vae-decoder-float16-fp32-instancenorm.onnx |

此处用的是其中解码部分，可将图片在一定范围内进行高质量拉升，即低分辨率至高分辨率提升后，尽可能保证常规场景的细节仍旧细腻完整，符合一定自然规律。

![VAE Decoder](./images/ai-vae-decoder.jpg)

#### 4. 健康检查

| 项 | 值 |
| ------ | -------------------- |
| 名称 | __safety-checker__ |
| 大小 | 580 MB |
| 地址 | https://huggingface.co/microsoft/stable-diffusion-v1.5-webnn/resolve/main/safety_checker_int32_reduceSum.onnx |

其实就是安全审核，过滤掉一些不该出现的内容。此过程执行时图片已经生成完毕，因此是个延后处理的过程。

### 引入依赖库

#### ONNX runtime web

可以通过 npm 和打包工具将代码嵌入至代码中，也可直接将脚本上传至字节的 CDN 上之后由页面引用。

[npm package (onnxruntime-web)](https://www.npmjs.com/package/onnxruntime-web)

```html
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0-dev.20240311-5479124834/dist/ort.webgpu.min.js" />
```

下方代码中 `ort` 即为 ONNX runtime web 所 `export` 出来的根实例。

### 前端代码

#### 1. 检测

对 WebNN 能力支持的检测非常简单，关键在于判断标识浏览器的 `navigator` 上的 `ml` 对象能否调用 `createContext` 方法，该方法允许传入一个可选的配置参数，并会返回一个 `fulfilled` 值为 `MLContext` 类型的 `Promise` 对象，可以利用该对象作为参数创建 `MLGraphBuilder` 实例，用于图的编译和执行，但此处我们只是借用是否包含这项能力来验证 WebNN 是否可用。

```javascript
async function builder() => {
    const context = await navigator.ml.createContext();
    if (!context) throw new Error();
    const builder = new MLGraphBuilder(context);
    if (builder) return builder;
    throw new Error();
};
```

#### 2. 加载模型

1. 我们实现一个模型加载函数，传入模型名称和初始化参数，通过 fetch 将线上模型文件下载存储值 OPFS（源私有文件系统）中（该函数 `getModelOPFS` 的具体细节和实现见后面随附的“辅助方法和配置”部分），并据此创建推理会话返回。

   这其中，名称是用于我们建立索引方便在 OPFS 中找文件用的，因此可以是任意字符串标识符；参数在是依据不同模型要求填入的，后面步骤 3.3 中会传入。

```javascript
/**
 * 加载具体的模型。
 */
async function loadModel(name, dimension) {
    let path = "model/" + modelMapping[name];
    const options = {
        executionProviders: [{
            name: executionProvider,
            deviceType: "gpu",
        }],
        freeDimensionOverrides: dimension,
        logSeverityLevel: 0
    };
    let modelBuffer = await getModelOPFS("sd_1.5_$" + name, path, false);
    return await ort.InferenceSession.create(modelBuffer, options);
}
```

2. 我们会为上述4个模型进行暂存。

```javascript
// 模型们都在这。
let textEncoderSession;
let vaeDecoderModelSession;
let unetModelSession;
let scModelSession;
```

3. 接下来，我们要进行初始化，即分别调用上述加载模型的函数并创建对应的推理会话，将其存入上述暂存变量中。当然，为了防止意外发生，我们在初始化之前还要先做清理，即如果推理会话已经存在，那么我们将其释放。
这其中，各模型的初始化参数是根据其要求传入的，其中部分字段在此处为固定值（配置代码详见后面随附“辅助方法和配置”部分）。

```javascript
/**
 * 加载模型们。
 */
async function init() {
    cleanUpModels();
    textEncoderSession = await loadModel("text-encoder", {
        batch: unetBatch, sequence: textEmbeddingSequenceLength,
    });
    unetModelSession = await loadModel("unet", {
        batch: unetBatch, channels: unetChannelCount, height: latentHeight, width: latentWidth, sequence: textEmbeddingSequenceLength, unet_sample_batch: unetBatch, unet_sample_channels: unetChannelCount, unet_sample_height: latentHeight, unet_sample_width: latentWidth, unet_time_batch: unetBatch, unet_hidden_batch: unetBatch, unet_hidden_sequence: textEmbeddingSequenceLength
    });
    vaeDecoderModelSession = await loadModel("vae-decoder", {
        batch: 1, channels: latentChannelCount, height: latentHeight, width: latentWidth,
    });
    scModelSession = await loadModel("safety-checker", {
        batch: 1, channels: 3, height: 224, width: 224,
    });
}

/**
 * 清理模型们。
 */
async function cleanUpModels() {
    if (!textEncoderSession) return;
    await unetModelSession.release();
    await textEncoderSession.release();
    await vaeDecoderModelSession.release();
    await scModelSession.release();
    unetModelSession = null;
    textEncoderSession = null;
    vaeDecoderModelSession = null;
    scModelSession = null;
}
```

#### 3. 运行模型

其实运行模型的关键在于构造模型运行过程中所需的参数，部分值来源于上下文（如前一个模型的返回值），因此这里面大部分代码都是在做这样的转换，这些参数的许多字段通常为 `MLTensor` 类型，因此常有需要将一些数组等对象转为为该类型类型（转化方法的实现可见后面随附“辅助方法和配置”部分）。而运行过程所需参数准备完毕后，对模型的调用本身其实很简单，只需对上述暂存的推理会话实例调用成员方法 ·run· 即可，其入参即为上述这些处理后的运行过程所需参数。

总体来说，依此按照文本编码、unet 循环执行、VAE 解码和健康审查顺序执行推理会话，其中会在 unet 执行前创建一个潜在空间用于存储其结果，以及在 VAE 解码完成后即可生成图片。

```javascript
async function run(positiveText, negativeText) {
    /* ------- 文本编码 ------- */
    const textEncoderInputs = textEncoderInputsGen(positiveText, negativeText);
    const textEncoderOutputs = await textEncoderSession.run(textEncoderInputs);

    /* ------- 生成潜在空间 ------- */
    const latentsTensor = toTensor(
        "float16",
        [unetBatch, unetChannelCount, latentHeight, latentWidth],
        latentSpace,
    );
    const halfLatentElementCount = latentsTensor.size / 2; // 只需要给出第一个 batch [2, 4, 64, 64]。
    let latents = await latentsTensor.getData();
    let halfLatents = latents.subarray(0, halfLatentElementCount); // 获取第一个 batch。

    /* ------- U-Net 循环执行 ------- */
    const unetInputs = await unetInputsGen(textEncoderOutputs);
    for (var i = 0; i < unetIterationCount; ++i) {
        unetInputsRound(unetInputs, i);
        const unetOutputs = await unetModelSession.run(unetInputs);
        let predictedNoise = new Uint16Array(unetOutputs["out_sample"].cpuData.buffer);
        denoiseLatentSpace(/*inout*/ latents, i, predictedNoise);
    }

    /* ------- VAE 解码 ------- */
    const vaeDecoderInputs = vaeDecoderInputs(latentsTensor, halfLatents);
    const decodedOutputs = await vaeDecoderModelSession.run(vaeDecoderInputs);

    /* ------- 在 Canvas 中显示 ------- */
    displayPlanarRGB(await decodedOutputs.sample.getData());
    
    /* ------- 运行健康审查 ------- */
    let resized_image_data = resize_image(224, 224);
    let normalized_image_data = normalizeImageData(resized_image_data);
    const { has_nsfw_concepts } = await scModelSession.run({
        clip_input: get_tensor_from_image(normalized_image_data, "NCHW"),
        images: get_tensor_from_image(resized_image_data, "NHWC"),
    });
    let nsfw = has_nsfw_concepts.data[0]; // flag about not safe for work
}
```

上述代码中渲染函数 `displayPlanarRGB`（具体实现此处略）接受坐标颜色信息，以将其绘制至 canvas 上即可。

具体各模型执行的入参准备函数如下。

1. __文本编码运行入参__：其中 `positiveText` 是正向文本描述，即用户想生成什么图片；`negativeText` 为负向，即排除掉哪些情形。

```javascript
async function textEncoderInputsGen(positiveText, negativeText) {
    let positive_token_ids = [49406];
    let negative_token_ids = [49406];
    const positive_text_ids = await getTokenizers(positiveText);
    positive_token_ids = positive_token_ids.concat(positive_text_ids);
    if (positive_text_ids.length > textEmbeddingSequenceLength - 2) {
        positive_token_ids = positive_token_ids.slice(0, textEmbeddingSequenceLength - 1);
        positive_token_ids.push(49407);
    } else {
        const fillerArray = new Array(textEmbeddingSequenceLength - positive_token_ids.length).fill(49407);
        positive_token_ids = positive_token_ids.concat(fillerArray);
    }

    let negative_text_ids = await getTokenizers(negativeText);
    negative_token_ids = negative_token_ids.concat(negative_text_ids);
    if (negative_text_ids.length > textEmbeddingSequenceLength - 2) {
        negative_token_ids = negative_token_ids.slice(0, textEmbeddingSequenceLength - 1);
        negative_token_ids.push(49407);
    } else {
        const fillerArray = new Array(textEmbeddingSequenceLength - negative_token_ids.length).fill(49407);
        negative_token_ids = negative_token_ids.concat(fillerArray);
    }

    const token_ids = positive_token_ids.concat(negative_token_ids);
    return {
        input_ids: toTensor("int32", [unetBatch, textEmbeddingSequenceLength], token_ids),
    };
}
```

2. __U-Net 运行入参__：包含入参基准的生成，以及后续循环时的变更。（其中潜在空间相关函数实现可见后面随附“辅助方法和配置”部分）

```javascript
async function unetInputsGen(textEncoderOutputs, halfLatents) {
    let latentSpace = new Uint16Array(latentWidth * latentHeight * unetChannelCount);
    generateNoise(/*inout*/ latentSpace, seed);
    latentSpace = new Uint16Array([...latentSpace, ...latentSpace]); // 根据 unetBatch 进行重复。
    prescaleLatentSpace(/*inout*/ halfLatents, defaultSigmas[0]);
    return {
        encoder_hidden_states: toTensor(
            "float16",
            [unetBatch, textEmbeddingSequenceLength, textEmbeddingSequenceWidth],
            textEncoderOutputs["last_hidden_state"].data,
        ),
    };
}

function unetInputsRound(unetInputs, i) {
    unetInputs["timestep"] = fillTensor("int64", [unetBatch], BigInt(Math.round(defaultTimeSteps[i])));
    let nextLatents = latents.slice(0); // 复制第一个 batch，用于正向和负向 prompt。
    let halfNextLatents = nextLatents.subarray(0, halfLatentElementCount);
    scaleLatentSpaceForPrediction(/*inout*/ halfNextLatents, i);
    nextLatents.copyWithin(halfLatentElementCount, 0, halfLatentElementCount); // 从低往高复制。
    unetInputs.sample = toTensor(
        "float16",
        [unetBatch, unetChannelCount, latentHeight, latentWidth],
        nextLatents,
    );
}
```

3. __VAE 解码运行入参__：由于上一步 unet 基本将结果存入了潜在空间，因此此处入参无需使用其对应 Outputs。

```javascript
function async vaeDecoderInputsGen(latentsTensor, halfLatents) {
    applyVaeScalingFactor(/*inout*/ halfLatents); // 从 latent 中解码。
    let dimensions = latentsTensor.dims.slice(0);
    dimensions[0] = 1; // 设置 batch 尺寸为 1。
    const vaeDecoderInputs = {
        latent_sample: toTensor("float16", dimensions, halfLatents.slice(0)),
    };
}
```

4. __审查入参__：较为简短，已位于 `run` 函数内。（其中涉及的变更图片大小等函数的实现此处略）

#### 辅助方法和配置

- __配置__

```javascript
const pixelWidth = 512;
const pixelHeight = 512;
const latentWidth = pixelWidth / 8;
const latentHeight = pixelHeight / 8;
const latentChannelCount = 4;
const unetBatch = 2;
const unetChannelCount = 4;
const textEmbeddingSequenceLength = 77;
const textEmbeddingSequenceWidth = 768;
const unetIterationCount = 25;
const executionProvider = "webnn";
const ArrayTypeMapping = {
    uint8: Uint8Array,
    int8: Int8Array,
    uint16: Uint16Array,
    int16: Int16Array,
    uint32: Uint32Array,
    int32: Int32Array,
    float16: Uint16Array,
    float32: Float32Array,
    uint64: BigUint64Array,
    int64: BigInt64Array
}
const modelMapping = { // 模型文件路径映射
    "text-encoder": "text-encoder.onnx",
    "unet": "sd-unet-v1.5-model-b2c4h64w64s77-float16-compute-and-inputs-layernorm.onnx",
    "vae-decoder": "Stable-Diffusion-v1.5-vae-decoder-float16-fp32-instancenorm.onnx",
    "safety-checker": "safety_checker_int32_reduceSum.onnx"
};
let seed = "1234"; // 随机数 - 可修改
```

- __模型 → OPFS__

```javascript
/**
 * 通过源私有文件系统（Origin Private File System）获取模型。
 */
async function getModelOPFS(name, url, updateModel) {
    const root = await navigator.storage.getDirectory();
    let fileHandle;

    async function updateFile() { // 更新
        const response = await fetch(url);
        const contentLength = response.headers.get("Content-Length");
        let total = parseInt(contentLength ?? "0");
        let buffer = new Uint8Array(total);
        let loaded = 0;
        const reader = response.body.getReader();
        
        async function read() { // 读取 fetch 的 response 的 buffer
            const { done, value } = await reader.read();
            if (done) return;
            let newLoaded = loaded + value.length;
            fetchProgress = (newLoaded / contentLength) * 100;
            if (newLoaded > total) {
                total = newLoaded;
                let newBuffer = new Uint8Array(total);
                newBuffer.set(buffer);
                buffer = newBuffer;
            }
            
            buffer.set(value, loaded);
            loaded = newLoaded;
            return read();
        }
    
        await read();
        fileHandle = await root.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(buffer);
        await writable.close();
        return buffer;
    }

    if (updateModel) return await updateFile();
    try {
        fileHandle = await root.getFileHandle(name);
        const blob = await fileHandle.getFile();
        return await blob.arrayBuffer();
    } catch (ex) {
        return await updateFile();
    }
}
```

- __转化为 `MLTensor` 类型__

```javascript
/**
 * 将值或 byte 数组转换为张量对象。
 */
export function toTensor(dataType, shape, values) {
    let size = 1;
    shape.forEach(element => {
        size *= element;
    });
    if (!(values instanceof ArrayBuffer) && values.buffer instanceof ArrayBuffer) values = values.buffer;
    const type = ArrayTypeMapping[dataType];
    if (!type) throw new Error(`Input tensor type ${dataType} is unknown`);
    return new ort.Tensor(dataType, new type(values), shape);
}

/**
 * 创建并填充张量对象。
 */
export function fillTensor(dataType, shape, values) {
    let size = 1;
    shape.forEach(element => {
        size *= element;
    });
    if (!(values instanceof ArrayBuffer) && values.buffer instanceof ArrayBuffer) values = values.buffer;
    const type = ArrayTypeMapping[dataType];
    if (!type) throw new Error(`Input tensor type ${dataType} is unknown`);
    return new ort.Tensor(
        dataType,
        type.from({ length: size }, () => value),
        shape,
    );
}
```

- __潜在空间相关__

```javascript
function generateNoise(latentSpace, seed) {
    let randomGenerator = practRandSimpleFastCounter32(
        Number(seed >> 0n) & 0xffffffff,
        Number(seed >> 32n) & 0xffffffff,
        Number(seed >> 64n) & 0xffffffff,
        Number(seed >> 96n) & 0xffffffff,
    );
    const elementCount = latentSpace.length;
    for (let i = 0; i < elementCount; ++i) {
        const u1 = randomGenerator();
        const u2 = randomGenerator();
        const radius = Math.sqrt(-2.0 * Math.log(u1));
        const theta = 2.0 * Math.PI * u2;
        const standardNormalRand = radius * Math.cos(theta);
        const newValue = standardNormalRand;
        latentSpace[i] = encodeFloat16(newValue);
    }
}

function prescaleLatentSpace(latentSpace, initialSigma) {
    const elementCount = latentSpace.length;
    for (let i = 0; i < elementCount; ++i) {
        latentSpace[i] = encodeFloat16(Utils.decodeFloat16(latentSpace[i]) * initialSigma);
    }
}

function scaleLatentSpaceForPrediction(latentSpace, iterationIndex) {
    let sigma = defaultSigmas[iterationIndex];
    let inverseScale = 1 / Math.sqrt(sigma * sigma + 1); // sample /= ((sigma^2 + 1) ^ 0.5)
    const elementCount = latentSpace.length;
    for (let i = 0; i < elementCount; ++i) {
        latentSpace[i] = encodeFloat16(Utils.decodeFloat16(latentSpace[i]) * inverseScale);
    }
}

function practRandSimpleFastCounter32(a, b, c, d) {
    return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}
```

### 运行效果

由此，整个文生图的大致逻辑便已完成。以下是部分运行截图。

![截图 1](./images/webnn-screenshot-1.jpg)
🔺 _运行时，浏览器的 GPU 加速进程消耗了大量 GPU 资源，说明模型运行于端侧浏览器中。另，标签页所占内存巨大，说明模型加载与本地。_

![截图 2](./images/webnn-screenshot-2.jpg)
🔺 _生成的图片。使用的 prompt 为：rainbow, castle, river, cloud。_

![截图 3](./images/webnn-screenshot-3.jpg)
🔺 _初始化和运行期间统计的指标信息。_

__附__：Demo 所用电脑相关主要配置如下。

| 类型 | 值 |
| -------- | -------------------- |
| 操作系统 | Windows 11 Pro version 23H2 |
| 浏览器 | Microsoft Edge v131.0.2903.51 |
| CPU | Intel® Core™ i7-13700H |
| GPU | Intel® Iris® Xe Graphics 核显 |
| NPU | 没有 |
| 内存 | 32GB |

## 结语

WebNN 是个刚出生的婴儿，但其所包含的强大能力已得以彰显：在 AI 以一种前所未有的速度显露扩张趋势时，通过更可靠的运行性能和更友好的访问方式，将其全面引入 Web 前端开发当中，允许在用户设备上的浏览器中，直接创建、编译和运行神经网络，或直接加载并运行已有 AI 模型，而无需分心于底层系统框架实现和所用的芯片为何，基于熟悉的 JS 开发，实现跨平台。

### 当下与展望

目前（2024年11月）WebNN 尚处 Candidate Recommendation Draft 状态，由 W3C 专门成立的小组 [Web Machine Learning Working Group](https://www.w3.org/groups/wg/webmachinelearning/) 在推进，距离最终正式版（Standard）还有一点时日。目前试验时，推荐在 Windows 11 上运行 Edge 浏览器，以获得最佳体验。

不过可以预见的是，鉴于 WebNN 标准已差不多成型，以及其所含能力的确是在 Web 前端以往完全不具备的，且这项能力是与时俱进、顺应潮流、象征着未来发展方向，因此我们可以认为 WebNN 从长线来看，其可发挥的作用不可估量，甚至会如同过往 HTML5 等许多变更一样具有普世性，即这将成为一项基础设施，成为每个 Web 前端、Hybrid 移动端、Web-based PC 客户端（如 Electron app）等模式的必备要素，因为它的变革可以带来更为显著的交互提升、能力提升、效率提升。

### 对于我们

受当下现实环境的网络和计算机硬件等限制影响，WebNN 尚存一些不适合的地方；但从长远看可能是未来两三年的一个显著方向，因为 AI 的普及对行业的影响，以及端 AI、Web 跨设备能力以及 WebNN 的一些其它优势特性，使得其更具潜力和价值。因此提前了解是具有前瞻性的。

利用 WebNN，可以将部分模型的推理甚至少量分布式训练部署到客户端浏览器侧，从而实现更为智能的能力，而完成此过程的额外工作量其实并没有很显著增加，因为对于端 AI 和在线（云端）AI 也是同样包含这部分工作量甚至更多，且前者考虑到跨平台、后者考虑到数据交互，其可能能节省更多工作量，而又占有前文所述的优势。

<!-- End -->
---

注：以上部分图片源自网络。
