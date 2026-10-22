/* Qinghai Lake ecosystem response — site interactions */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var C = {
    lake: "#1b6a73",
    deep: "#0b3c44",
    grass: "#6d8a55",
    sand: "#b3865a",
    alert: "#a4543a",
    line: "#bfc9bd",
    text: "#64797a"
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function num(v) { return Number(v); }
  function fmt(v, d) {
    var n = Number(v);
    if (isNaN(n)) return String(v);
    if (d === 0) return n.toLocaleString("en-US");
    return n.toFixed(d == null ? 1 : d);
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function svgOpen(w, h, label) {
    return '<svg viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' + esc(label) + '" preserveAspectRatio="xMidYMid meet">';
  }
  function text(x, y, s, cls, anchor, fill, size) {
    var a = ' x="' + x + '" y="' + y + '"';
    if (anchor) a += ' text-anchor="' + anchor + '"';
    if (fill) a += ' fill="' + fill + '"';
    if (size) a += ' font-size="' + size + '"';
    return "<text" + a + ' class="' + (cls || "") + '">' + esc(s) + "</text>";
  }

  /* ---------------- data ---------------- */
  var steps = {
    1: {
      code: "S01", title: "水位情景设定", status: "待填数", statusClass: "todo",
      question: "把所有后续计算锚定在同一组水位情景上：历史回代、现状基准、三档上涨、极端高水位，以及一个可接入调控策略的接口。",
      input: "历史与现状水位、湖区边界、DEM、未来气候情景（CHELSA）。",
      method: "S00 历史基准 → S01 现状 → S02–S04 低 / 中 / 高幅上涨 → S05 极端高水位 → S06+ 调控情景接口。",
      output: "水位情景表、各情景淹没边界条件、与调控策略对接的接口。",
      judge: "情景编号与用途已定义，但水位数值全部标注“待填写”。",
      note: "这是当前最关键的卡点：情景不落地，EFI 曲线、阈值、稳定性与三维表达都无法可靠生成。",
      chain: "全部环节的上游输入；决定“响应曲线”的横轴。",
      source: "来源：模型集.docx · 表 3 水位情景"
    },
    2: {
      code: "S02", title: "湖岸生态空间重构", status: "已跑通（局部）", statusClass: "done",
      question: "水位抬升后，湖面外扩到哪里？湿地、草地、裸地如何转换？岸线是更破碎还是更聚合？",
      input: "DEM、逐年湖岸线、CLCD 30 m 土地利用（1990–2025）。",
      method: "DEM 岸线高程校正；岸线外 100 / 300 / 500 m 缓冲；NP、PD、ED、AI、CONTAG、SHDI 等景观指数。",
      output: "校正后的岸线、湿地 / 草地 / 水体变化、连通性与破碎化指标。",
      judge: "DEM 中位偏差 1.214 m 已订正；300 m 主尺度 + 两个验证尺度已完成。",
      note: "尚未实现“连续低地路径”的 DEM 连通判定，也尚未生成多情景淹没范围。",
      chain: "空间链的起点，向 M1-02、M1-03、M1-07 提供统一空间底图。",
      source: "来源：DEM校正.docx · 湖岸带景观格局分析.docx"
    },
    3: {
      code: "S03", title: "生境质量与生态系统服务", status: "试算中", statusClass: "partial",
      question: "生境质量在变好还是变差？淹没草地会把多少陆源氮磷带进湖里？",
      input: "CLCD 30 m、威胁因子与敏感性参数、DEM / 降水 / 土壤（NDR）。",
      method: "InVEST Habitat Quality（k = 0.5；耕地 4 km / 0.7，裸地 2 km / 0.2）；NDR 营养盐输送探索。",
      output: "生境质量栅格、流域均值、空间变化；潜在氮磷通量。",
      judge: "1990–2025 生境质量均值已产出；NDR 仍缺本地化参数与淹没释放系数。",
      note: "生境质量是相对指数，不宜直接等同于生物多样性；NDR 也捕捉不到地下水与淹没释放。",
      chain: "空间链的中段，为 HSI 提供生境本底、为 EFI 提供 H 项。",
      source: "来源：生境质量.docx · Invest模型.docx"
    },
    4: {
      code: "S04", title: "关键物种栖息地", status: "部分完成", statusClass: "partial",
      question: "水位、盐度、食物与植被变化之后，裸鲤、水鸟和普氏原羚的适宜栖息地还剩多少、在哪里？",
      input: "物种分布与观测、产卵 / 觅食 / 栖息数据、环境因子（水深、流速、植被、食物）。",
      method: "HSI = Σ(ωj × Sij)：因子标准化、权重赋值、适宜性分级；未来情景叠加。",
      output: "HSI 栅格、适宜生境面积、迁徙 / 洄游通道。",
      judge: "普氏原羚 HSI 与 ssp126 / ssp585 变化图已试算；裸鲤、水鸟因子体系待建。",
      note: "权重来源与验证依据是评审重点，不能只给经验赋值。",
      chain: "物种链的核心，向 M1-04 提供风险对象、向 M1-05 提供节点状态。",
      source: "来源：栖息地适宜性.docx"
    },
    5: {
      code: "S05", title: "生态风险评价", status: "指标待定稿", statusClass: "todo",
      question: "哪些物种与生境在高水位情景下最脆弱？风险集中在哪些空间？",
      input: "物种 / 生境分布、胁迫因子、暴露与敏感性数据。",
      method: "CRI 指标体系；项目文件未给出统一公式，需专题审定指标、权重与分级。",
      output: "风险指数、风险等级、风险空间。",
      judge: "黑颈鹤、普氏原羚等风险对象已明确，但指标与分级尚未定稿。",
      note: "公式未定稿前不宜对外发布风险等级，否则难以复现与评审。",
      chain: "物种链的出口，向网络分析提供胁迫权重。",
      source: "来源：模型集.docx · 表 1（M1-04）"
    },
    6: {
      code: "S06", title: "“水—草—鱼—鸟”网络", status: "统计网络已建", statusClass: "partial",
      question: "水位变化如何沿食物网传递？哪些链路最稳，哪些环节已经断了？",
      input: "2020–2025 监测（水位、浮游植物 / 动物、裸鲤、水鸟、可食生物量、普氏原羚）；2014–2023 复核序列。",
      method: "线性 / 多元回归 + AICc 双向逐步筛选 + LOOCV；网络连通度 C = L / [n(n−1)]。",
      output: "显著链路、R² / MAE / RMSE / nRMSE、关键节点。",
      judge: "鱼—水位、兽—草两段稳健；藻类环节解释力不足（Chl-a ~ 水位 R² = 0.024）。",
      note: "当前是统计相关网络，不是能量流网络；ENA 指标与 ENSI 仍需补做。",
      chain: "网络链的核心，把空间与物种结果合成系统结构。",
      source: "来源：生态网络模型（水藻草鱼鸟兽）.docx"
    },
    7: {
      code: "S07", title: "稳定性与脆弱性", status: "未启动", statusClass: "todo",
      question: "在水位扰动下，系统还能不能维持原有结构与功能？哪个节点最先失稳？",
      input: "网络结构、节点 / 链路扰动、多水位情景。",
      method: "ENSI 评价韧性、连通与稳态维持；NVIi = ΔFi / Fi,baseline 描述节点相对变化。",
      output: "稳定性指数、脆弱节点、关键保护节点。",
      judge: "公式形式已给出，尚无计算结果。",
      note: "必须有“多情景网络输出”才能算稳定性；当前只有单一时序网络。",
      chain: "网络链的中段，向 EFI 与阈值提供系统稳定性维度。",
      source: "来源：模型集.docx · 3.6 节"
    },
    8: {
      code: "S08", title: "综合功能与生态阈值", status: "框架 + 试算", statusClass: "partial",
      question: "把连通、数量、质量合成一个指数后，水位升到哪里会从增益转为衰退？",
      input: "WCI、适宜生境面积 S、生境质量 H、连续水位情景。",
      method: "EFI = w1·WCI/WCImax + w2·S/Smax + w3·H/Hmax；非线性拟合识别增益 / 稳定 / 转折 / 衰退区间。",
      output: "水位—EFI 曲线、生态阈值、安全区间、阈值分区图。",
      judge: "三要素框架与 WCI 试算完成；权重、连续情景与曲线拟合未完成。",
      note: "5 个年度点不足以拟合阈值，必须用情景模拟补点并做权重敏感性分析。",
      chain: "全部环节的汇合点，直接支撑生态安全水位管理。",
      source: "来源：生态功能指数.docx · 模型集.docx"
    }
  };

  /* ---------------- route ---------------- */
  var routeGrid = $("#routeGrid");
  var detail = {
    code: $("#detailCode"), title: $("#detailTitle"), status: $("#detailStatus"),
    question: $("#detailQuestion"), input: $("#detailInput"), method: $("#detailMethod"),
    output: $("#detailOutput"), judge: $("#detailJudge"), note: $("#detailNote"),
    chain: $("#detailChain"), source: $("#detailSource")
  };
  function selectStep(n) {
    var s = steps[n];
    if (!s) return;
    $$(".route-step", routeGrid).forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-step") === String(n) ? "true" : "false");
    });
    detail.code.textContent = s.code;
    detail.title.textContent = s.title;
    detail.status.textContent = s.status;
    detail.status.className = "status-pill " + s.statusClass;
    detail.question.textContent = s.question;
    detail.input.textContent = s.input;
    detail.method.textContent = s.method;
    detail.output.textContent = s.output;
    detail.judge.textContent = s.judge;
    detail.note.textContent = s.note;
    detail.chain.textContent = s.chain;
    detail.source.textContent = s.source;
  }
  if (routeGrid) {
    routeGrid.addEventListener("click", function (e) {
      var btn = e.target.closest(".route-step");
      if (btn) selectStep(btn.getAttribute("data-step"));
    });
    selectStep(2);
  }

  /* ---------------- model filter ---------------- */
  var modelGrid = $("#modelGrid");
  var modelCount = $("#modelCount");
  if (modelGrid) {
    var cards = $$(".model-card", modelGrid);
    $$(".filter").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        $$(".filter").forEach(function (b) { b.classList.toggle("active", b === btn); });
        var shown = 0;
        cards.forEach(function (card) {
          var ok = f === "all" || card.getAttribute("data-status") === f;
          card.hidden = !ok;
          if (ok) shown++;
        });
        modelCount.textContent = "显示 " + shown + " / " + cards.length;
      });
    });
  }

  /* ---------------- nav ---------------- */
  var nav = $("#nav");
  var toggle = $(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", nav).forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var secs = ["overview", "route", "models", "results", "data", "stage", "delivery"];
  var links = {};
  secs.forEach(function (id) {
    var a = $('.nav a[href="#' + id + '"]');
    if (a) links[id] = a;
  });
  function spy() {
    var pos = window.scrollY + 130;
    var current = null;
    secs.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= pos) current = id;
    });
    secs.forEach(function (id) {
      if (links[id]) links[id].classList.toggle("active", id === current);
    });
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  /* ---------------- to top ---------------- */
  var top = $(".to-top");
  if (top) {
    window.addEventListener("scroll", function () {
      top.classList.toggle("show", window.scrollY > 700);
    }, { passive: true });
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------- chart helpers ---------------- */
  function smoothPath(pts) {
    if (!pts.length) return "";
    var d = "M" + pts[0][0].toFixed(2) + "," + pts[0][1].toFixed(2);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6;
      var c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6;
      var c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += " C" + c1x.toFixed(2) + "," + c1y.toFixed(2) + " " + c2x.toFixed(2) + "," + c2y.toFixed(2) + " " + p2[0].toFixed(2) + "," + p2[1].toFixed(2);
    }
    return d;
  }

  function lineChart(id, cfg) {
    var mount = document.getElementById(id);
    if (!mount) return;
    var w = 560, h = cfg.h || 232;
    var m = { t: 26, r: 16, b: 30, l: 44 };
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    var labels = cfg.labels;
    var n = labels.length;
    var all = [];
    cfg.series.forEach(function (s) { s.values.forEach(function (v) { all.push(num(v)); }); });
    var yMin = cfg.yMin != null ? cfg.yMin : Math.min.apply(null, all);
    var yMax = cfg.yMax != null ? cfg.yMax : Math.max.apply(null, all);
    var pad = (yMax - yMin) * 0.06;
    yMin -= pad; yMax += pad;
    function X(i) { return m.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw); }
    function Y(v) { return m.t + (1 - (v - yMin) / (yMax - yMin)) * ih; }
    var out = svgOpen(w, h, cfg.aria || "数据图");
    if (cfg.yTitle) out += text(m.l, 12, cfg.yTitle, "", null, C.text, 8.5);
    var ticks = cfg.yTicks || 4;
    for (var t = 0; t <= ticks; t++) {
      var val = yMin + (yMax - yMin) * t / ticks;
      var y = Y(val);
      out += '<line class="gridline" x1="' + m.l + '" y1="' + y.toFixed(1) + '" x2="' + (w - m.r) + '" y2="' + y.toFixed(1) + '"/>';
      out += text(m.l - 7, y + 3, fmt(val, cfg.digits == null ? 0 : cfg.digits), "xlabel", "end");
    }
    out += '<line class="axisline" x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (w - m.r) + '" y2="' + (m.t + ih) + '"/>';
    var step = n > 8 ? 2 : 1;
    labels.forEach(function (lb, i) {
      if (i % step === 0 || i === n - 1) {
        out += text(X(i), m.t + ih + 16, lb, "xlabel", "middle");
      }
    });
    if (cfg.legend) {
      var lx = m.l + 2;
      cfg.legend.forEach(function (lg, i) {
        var ly = 11 + i * 11;
        out += '<line x1="' + lx + '" y1="' + (ly - 3) + '" x2="' + (lx + 16) + '" y2="' + (ly - 3) + '" stroke="' + lg.color + '" stroke-width="1.8" ' + (lg.dash ? 'stroke-dasharray="4 3"' : "") + "/>";
        out += text(lx + 21, ly, lg.name, "xlabel", null, C.text, 8.5);
      });
    }
    cfg.series.forEach(function (s, si) {
      var pts = s.values.map(function (v, i) { return [X(i), Y(num(v))]; });
      var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(2) + "," + p[1].toFixed(2); }).join(" ");
      if (s.area) {
        var ad = d + " L" + pts[pts.length - 1][0].toFixed(2) + "," + (m.t + ih) + " L" + pts[0][0].toFixed(2) + "," + (m.t + ih) + " Z";
        out += '<path d="' + ad + '" fill="' + (s.fill || "rgba(27,106,115,.08)") + '" stroke="none"/>';
      }
      out += '<path class="series" d="' + d + '" stroke="' + s.color + '" ' + (s.dash ? 'stroke-dasharray="4 3"' : "") + "/>";
      if (s.dots !== false) {
        pts.forEach(function (p, i) {
          out += '<circle class="point" cx="' + p[0].toFixed(2) + '" cy="' + p[1].toFixed(2) + '" r="2.6" fill="' + s.color + '"><title>' + esc(labels[i] + " · " + s.name + " " + s.values[i]) + "</title></circle>";
        });
      }
      if (s.labelLast !== false) {
        var last = pts[pts.length - 1];
        out += text(last[0] - 3, last[1] - 8, s.name, "annotation", "end", s.color, 8.5);
      }
    });
    if (cfg.annotation) {
      var ai = cfg.annotation.index;
      var p = [X(ai), Y(num(cfg.series[0].values[ai]))];
      out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.4" fill="none" stroke="' + C.deep + '" stroke-width="1.2"/>';
      out += text(p[0] + 7, p[1] - 8, cfg.annotation.text, "annotation", null, C.deep, 8.5);
    }
    out += "</svg>";
    mount.innerHTML = out;
  }

  function barChart(id, cfg) {
    var mount = document.getElementById(id);
    if (!mount) return;
    var w = 560, h = cfg.h || 220;
    var m = { t: 26, r: 14, b: 34, l: 46 };
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    var labels = cfg.labels, vals = cfg.values.map(num);
    var max = cfg.yMax != null ? cfg.yMax : Math.max.apply(null, vals) * 1.12;
    var yMin = 0;
    function Y(v) { return m.t + (1 - (v - yMin) / (max - yMin)) * ih; }
    var out = svgOpen(w, h, cfg.aria || "柱状图");
    if (cfg.yTitle) out += text(m.l, 12, cfg.yTitle, "", null, C.text, 8.5);
    var ticks = cfg.yTicks || 3;
    for (var t = 0; t <= ticks; t++) {
      var val = max * t / ticks;
      var y = Y(val);
      out += '<line class="gridline" x1="' + m.l + '" y1="' + y.toFixed(1) + '" x2="' + (w - m.r) + '" y2="' + y.toFixed(1) + '"/>';
      out += text(m.l - 7, y + 3, cfg.tickFormat ? cfg.tickFormat(val) : fmt(val, cfg.yDigits == null ? 0 : cfg.yDigits), "xlabel", "end");
    }
    out += '<line class="axisline" x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (w - m.r) + '" y2="' + (m.t + ih) + '"/>';
    var gap = iw / labels.length;
    var bw = Math.min(cfg.barWidth || 34, gap * 0.55);
    labels.forEach(function (lb, i) {
      var x = m.l + gap * i + (gap - bw) / 2;
      var y = Y(vals[i]);
      var bh = m.t + ih - y;
      out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(bh, 1).toFixed(1) + '" fill="' + (cfg.colors ? cfg.colors[i % cfg.colors.length] : C.lake) + '" rx="1"><title>' + esc(lb + " · " + vals[i]) + "</title></rect>";
      out += text(x + bw / 2, y - 6, cfg.valueFormat ? cfg.valueFormat(vals[i]) : fmt(vals[i], cfg.valueDigits == null ? 0 : cfg.valueDigits), "barlabel", "middle");
      out += text(x + bw / 2, m.t + ih + 16, lb, "xlabel", "middle");
    });
    out += "</svg>";
    mount.innerHTML = out;
  }

  function hbarChart(id, cfg) {
    var mount = document.getElementById(id);
    if (!mount) return;
    var items = cfg.items;
    var w = 560, h = cfg.h || 250;
    var m = { t: 18, r: 36, b: 22, l: 150 };
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    var gap = ih / items.length;
    var bh = Math.min(15, gap * 0.48);
    var out = svgOpen(w, h, cfg.aria || "条形图");
    for (var t = 0; t <= 4; t++) {
      var x = m.l + iw * t / 4;
      out += '<line class="gridline" x1="' + x + '" y1="' + m.t + '" x2="' + x + '" y2="' + (m.t + ih) + '"/>';
      out += text(x, m.t + ih + 14, (t / 4).toFixed(1), "xlabel", "middle");
    }
    items.forEach(function (it, i) {
      var y = m.t + gap * i + (gap - bh) / 2;
      var bw = iw * Math.min(it.value, 1);
      out += text(m.l - 10, y + bh / 2 + 3, it.label, "xlabel", "end");
      out += '<rect x="' + m.l + '" y="' + y.toFixed(1) + '" width="' + Math.max(bw, 1).toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + it.color + '" rx="1"><title>' + esc(it.label + " · R² = " + it.value) + "</title></rect>";
      out += text(m.l + bw + 6, y + bh / 2 + 3, it.value.toFixed(3), "barlabel", null, it.color);
    });
    out += "</svg>";
    mount.innerHTML = out;
  }

  function heroChart() {
    var mount = document.getElementById("heroChart");
    if (!mount) return;
    var w = 560, h = 292;
    var m = { t: 34, r: 18, b: 34, l: 38 };
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    var x0 = 3192, x1 = 3198;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * iw; }
    function Y(v) { return m.t + (1 - v) * ih; }
    var zones = [
      { a: 3192, b: 3195.2, c: "rgba(109,138,85,.10)", label: "增益" },
      { a: 3195.2, b: 3196.6, c: "rgba(27,106,115,.09)", label: "稳定" },
      { a: 3196.6, b: 3197.4, c: "rgba(197,154,84,.13)", label: "转折" },
      { a: 3197.4, b: 3198, c: "rgba(164,84,58,.10)", label: "衰退" }
    ];
    var out = svgOpen(w, h, "水位—生态功能响应示意图，非计算结果");
    zones.forEach(function (z) {
      out += '<rect x="' + X(z.a) + '" y="' + m.t + '" width="' + (X(z.b) - X(z.a)) + '" height="' + ih + '" fill="' + z.c + '"/>';
      out += text((X(z.a) + X(z.b)) / 2, m.t - 9, z.label, "zone-label", "middle", z.b > 3196.6 ? C.sand : C.lake, 8.5);
    });
    for (var t = 0; t <= 4; t++) {
      var val = t / 4;
      var y = Y(val);
      out += '<line class="gridline" x1="' + m.l + '" y1="' + y + '" x2="' + (w - m.r) + '" y2="' + y + '"/>';
      out += text(m.l - 7, y + 3, val.toFixed(1), "xlabel", "end");
    }
    out += '<line class="axisline" x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (w - m.r) + '" y2="' + (m.t + ih) + '"/>';
    for (var lv = 3192; lv <= 3198; lv += 1) {
      out += text(X(lv), m.t + ih + 16, String(lv), "xlabel", "middle");
    }
    var pts = [[3192, .28], [3193, .40], [3194, .56], [3195, .71], [3195.8, .81], [3196.4, .86], [3196.9, .84], [3197.4, .74], [3198, .55]];
    var path = smoothPath(pts.map(function (p) { return [X(p[0]), Y(p[1])]; }));
    out += '<path d="' + path + '" fill="none" stroke="' + C.deep + '" stroke-width="2.2" stroke-linecap="round"/>';
    var cur = 3197.16;
    var cy = .786;
    out += '<line x1="' + X(cur) + '" y1="' + m.t + '" x2="' + X(cur) + '" y2="' + (m.t + ih) + '" stroke="' + C.alert + '" stroke-width="1" stroke-dasharray="3 3"/>';
    out += '<circle cx="' + X(cur) + '" cy="' + Y(cy) + '" r="4.2" fill="' + C.alert + '" stroke="#f6f3ea" stroke-width="2"/>';
    out += text(X(cur) + 8, Y(cy) - 12, "当前 3197.16 m", "annotation", null, C.alert, 9);
    out += text(m.l, 14, "EFI 综合生态功能（示意）", "", null, C.text, 8.5);
    out += text(w - m.r, 12, "单位：m", "xlabel", "end", C.text, 8.5);
    out += "</svg>";
    mount.innerHTML = out;
  }

  /* ---------------- render charts ---------------- */
  heroChart();

  lineChart("chartDem", {
    labels: ["2010", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"],
    series: [
      { name: "水位", color: C.lake, values: [3193.593, 3194.313, 3194.327, 3194.443, 3194.530, 3194.933, 3195.411, 3195.966, 3196.335, 3196.510, 3196.570] },
      { name: "DEM 岸线", color: C.sand, dash: true, labelLast: false, values: [3195.000, 3195.062, 3195.073, 3195.757, 3196.000, 3196.000, 3197.000, 3197.000, 3197.501, 3197.724, 3197.884] }
    ],
    yMin: 3192.9, yMax: 3198.6, yTicks: 4, digits: 1,
    legend: [{ name: "水位", color: C.lake }, { name: "DEM 岸线", color: C.sand, dash: true }],
    yTitle: "高程 / m", h: 236,
    aria: "2010 至 2022 年水位与 DEM 岸线中位高程均上升，两条曲线近似平行"
  });

  lineChart("chartHq", {
    labels: ["1990", "1995", "2000", "2005", "2010", "2015", "2020", "2021", "2022", "2023", "2024", "2025"],
    series: [{ name: "生境质量", color: C.lake, values: [0.759245, 0.762121, 0.763210, 0.769704, 0.771075, 0.773567, 0.771117, 0.770935, 0.769212, 0.769269, 0.769049, 0.771015], area: true }],
    yMin: 0.755, yMax: 0.778, yTicks: 4, digits: 3,
    annotation: { index: 5, text: "2015 峰值 0.774" },
    yTitle: "均值", h: 232,
    aria: "1990 至 2025 年流域平均生境质量先升后降，2015 年达到峰值 0.774"
  });

  barChart("chartWci", {
    labels: ["2010", "2015", "2020", "2021", "2022"],
    values: [2.1501, 16.9704, 18.2214, 13.905, 13.0428],
    yMax: 20, yTicks: 4, valueDigits: 1,
    colors: ["#7fa8a1", C.lake, C.lake, "#7fa8a1", "#7fa8a1"],
    yTitle: "连通面积 / km²", h: 224,
    aria: "1000 米缓冲区连通面积 2010 年 2.15 平方公里，2015 年升至 18.22，2022 年回落至 13.04"
  });

  hbarChart("chartNet", {
    items: [
      { label: "鱼 ← 水位 · 20–25", value: 0.912, color: C.lake },
      { label: "鸟 ← 鱼+浮游 · 20–25", value: 0.850, color: C.lake },
      { label: "兽 ← 草+水位 · 20–25", value: 0.650, color: C.lake },
      { label: "鱼 ← 水位 · 14–23", value: 0.932, color: C.grass },
      { label: "兽 ← 草+水位 · 14–23", value: 0.968, color: C.grass },
      { label: "藻 Chl-a ← 水位 · 14–23", value: 0.024, color: C.alert }
    ],
    h: 252,
    aria: "生态网络各链路解释力：鱼与兽链路 R 方最高，藻类链路仅 0.024"
  });

  barChart("chartAlgae", {
    labels: ["2005", "2010", "2015", "2020", "2025"],
    values: [281.61, 5453.28, 13096.44, 27030.42, 31059.72],
    yMax: 32000, yTicks: 4, valueDigits: 0,
    tickFormat: function (v) { return v === 0 ? "0" : (v / 1000).toFixed(0) + "k"; },
    valueFormat: function (v) { return v >= 1000 ? Math.round(v).toLocaleString("en-US") : v.toFixed(0); },
    colors: ["#c9d6c8", "#a8c1b6", "#7fa8a1", "#4f8b7d", C.lake],
    yTitle: "新增水域 / ha", h: 224,
    aria: "年新增水域面积从 2005 年 282 公顷增长到 2025 年 31060 公顷"
  });

  barChart("chartTn", {
    labels: ["2020", "2021", "2022", "2023", "2024", "2025"],
    values: [0.902, 1.000, 0.801, 0.758, 0.883, 0.701],
    yMax: 1.2, yTicks: 3, valueDigits: 2,
    colors: ["#7fa8a1", "#7fa8a1", "#7fa8a1", "#7fa8a1", "#7fa8a1", C.lake],
    yTitle: "TN / mg·L⁻¹", h: 224,
    aria: "总氮年均值在 0.70 至 1.00 毫克每升之间波动，2025 年为 0.701"
  });
})();