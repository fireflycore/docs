import{_ as a,c as i,a1 as n,o as e}from"./chunks/framework.DiyHpDmR.js";const c=JSON.parse('{"title":"Jenkins 流水线","description":"","frontmatter":{},"headers":[],"relativePath":"deploy/jenkins.md","filePath":"deploy/jenkins.md","lastUpdated":1783292246000}'),l={name:"deploy/jenkins.md"};function p(t,s,h,k,d,r){return e(),i("div",null,s[0]||(s[0]=[n(`<h1 id="jenkins-流水线" tabindex="-1">Jenkins 流水线 <a class="header-anchor" href="#jenkins-流水线" aria-label="Permalink to &quot;Jenkins 流水线&quot;">​</a></h1><p>Firefly Go 服务的 CI/CD 应围绕协议生成、依赖注入、测试、构建和部署前检查组织。下面示例以 <code>go-layout</code> 派生服务为基准。</p><h2 id="推荐阶段" tabindex="-1">推荐阶段 <a class="header-anchor" href="#推荐阶段" aria-label="Permalink to &quot;推荐阶段&quot;">​</a></h2><div class="language-text vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">text</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>checkout</span></span>
<span class="line"><span>  -&gt; tool check</span></span>
<span class="line"><span>  -&gt; buf generate</span></span>
<span class="line"><span>  -&gt; goverter</span></span>
<span class="line"><span>  -&gt; wire</span></span>
<span class="line"><span>  -&gt; go mod tidy check</span></span>
<span class="line"><span>  -&gt; go test</span></span>
<span class="line"><span>  -&gt; build</span></span>
<span class="line"><span>  -&gt; image</span></span>
<span class="line"><span>  -&gt; deploy</span></span></code></pre></div><h2 id="核心命令" tabindex="-1">核心命令 <a class="header-anchor" href="#核心命令" aria-label="Permalink to &quot;核心命令&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">make</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> generate</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">wire</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ./cmd/server</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">go</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> mod</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> tidy</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">go</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> test</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ./...</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">make</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> build</span></span></code></pre></div><p><code>make init</code> 已经包含生成、Wire 和 <code>go mod tidy</code>，但 CI 中建议把关键步骤拆开，便于定位失败点。</p><h2 id="jenkinsfile-示例" tabindex="-1">Jenkinsfile 示例 <a class="header-anchor" href="#jenkinsfile-示例" aria-label="Permalink to &quot;Jenkinsfile 示例&quot;">​</a></h2><div class="language-groovy vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">groovy</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">pipeline {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  agent any</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  stages {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    stage(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;Generate&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      steps {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        sh </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;buf generate&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        sh </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;goverter gen ./internal/biz/convert&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    stage(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;Wire&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      steps {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        sh </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;wire ./cmd/server&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    stage(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;Test&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      steps {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        sh </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;go mod tidy&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        sh </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;go test ./...&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    stage(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;Build&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      steps {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">        sh </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;make build&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">      }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><h2 id="部署前检查" tabindex="-1">部署前检查 <a class="header-anchor" href="#部署前检查" aria-label="Permalink to &quot;部署前检查&quot;">​</a></h2><ul><li><code>dep/protobuf/gen/gateway.manifest.json</code> 已生成并随构建产物发布。</li><li>对应 namespace 的 proto 项目已发布 descriptor current，例如 <code>{namespace}/api-gateway/descriptor/current</code>。</li><li><code>conf/bootstrap.json</code> 中的 <code>app.id</code>、<code>service.name</code>、<code>service.namespace</code> 和端口符合目标环境。</li><li>裸机场景中，目标节点已部署 <code>sidecar-agent</code> 和 Envoy。</li><li>如果启用本地 authz 验签，<code>authz_verification</code> 必须能加载正确的 Ed25519 公钥。</li></ul><h2 id="不建议" tabindex="-1">不建议 <a class="header-anchor" href="#不建议" aria-label="Permalink to &quot;不建议&quot;">​</a></h2><ul><li>不在 CI 中手写 route JSON 替代 manifest。</li><li>不把旧 <code>Authorization</code> 当作 Firefly 身份主线做联调断言。</li><li>不跳过 <code>wire</code>，否则构造函数或 ProviderSet 的变更可能在部署后才暴露。</li></ul>`,13)]))}const o=a(l,[["render",p]]);export{c as __pageData,o as default};
