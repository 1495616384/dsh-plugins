window.__ModuleLoader__.load({
	id: "@local/dsh-client-ui-finance",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region css
		const css = `
.fin-fab{border:1px solid var(--dsw-alias-border-l2);min-width:32px;height:32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:16px;align-items:center;gap:6px;padding:0 7px;font-size:13px;display:inline-flex;box-sizing:border-box}
.fin-fab:hover{background:var(--dsw-alias-interactive-bg-hover)}
.fin-modal{width:min(780px,94vw)}
.fin-root{display:flex;flex-direction:column;gap:12px}
.fin-tabs{display:flex;gap:6px;border-bottom:1px solid var(--dsw-alias-border-l1);padding-bottom:10px;flex-wrap:wrap}
.fin-tab{border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-secondary);cursor:pointer;border-radius:999px;padding:5px 14px;font-size:13px;font-family:var(--dsw-font-family)}
.fin-tab:hover{background:var(--dsw-alias-interactive-bg-hover)}
.fin-tab-active{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary);font-weight:500}
.fin-body{display:flex;flex-direction:column;gap:14px;max-height:min(62vh,640px);overflow:auto;padding-right:4px}
.fin-section{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.fin-section-title{font-weight:600;font-size:13px;color:var(--dsw-alias-label-primary)}
.fin-hint{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.55}
.fin-grid{display:flex;flex-wrap:wrap;gap:10px}
.fin-field{display:flex;flex-direction:column;gap:4px;min-width:120px;flex:1}
.fin-field-label{font-size:12px;color:var(--dsw-alias-label-secondary)}
.fin-field-box{display:flex;align-items:center;gap:6px}
.fin-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:6px;height:28px;padding:0 8px;font-size:13px;outline:none;min-width:0;width:100%;box-sizing:border-box;font-family:var(--dsw-font-family)}
.fin-input:focus{border-color:var(--dsw-alias-state-business-primary)}
.fin-suffix{font-size:12px;color:var(--dsw-alias-label-tertiary);flex:none}
.fin-stats{display:flex;gap:10px;flex-wrap:wrap}
.fin-stat{flex:1;min-width:110px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px}
.fin-stat-value{font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}
.fin-stat-label{font-size:12px;color:var(--dsw-alias-label-tertiary);margin-top:2px}
.fin-stat-good .fin-stat-value{color:var(--dsw-alias-state-business-primary)}
.fin-stat-bad .fin-stat-value{color:var(--dsw-alias-state-error-primary)}
.fin-note{font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary);border-radius:8px;padding:8px 10px;background:var(--dsw-alias-interactive-bg-hover)}
.fin-note-good{color:var(--dsw-alias-state-business-primary)}
.fin-note-bad{color:var(--dsw-alias-state-error-primary)}
.fin-table{width:100%;border-collapse:collapse;font-size:13px;color:var(--dsw-alias-label-primary)}
.fin-table th{text-align:left;font-weight:500;color:var(--dsw-alias-label-tertiary);padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap}
.fin-table td{padding:5px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);vertical-align:middle}
.fin-table .fin-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.fin-row-best td{color:var(--dsw-alias-state-business-primary)}
.fin-row-worst td{color:var(--dsw-alias-state-error-primary)}
.fin-badge{font-size:11px;border:1px solid currentColor;border-radius:999px;padding:1px 7px;margin-left:6px;white-space:nowrap}
.fin-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.fin-foot{font-size:12px;color:var(--dsw-alias-label-caption);line-height:1.5}
.fin-strong{font-weight:600}
`;
		const tagId = "@local/dsh-client-ui-finance/finance.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@local/dsh-client-ui-finance";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region helpers
		const P = _deepseek_ai_dsh_client_ui_primitives;
		const h = (type, props, ...children) => react.createElement(type, props ?? null, ...children);
		const Fragment = react.Fragment;
		const num = (v) => {
			const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[,，]/g, ""));
			return Number.isFinite(n) ? n : 0;
		};
		const fmtMoney = (x, digits = 2) => "¥" + num(x).toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: digits });
		const fmtNum = (x, digits = 2) => num(x).toLocaleString("zh-CN", { maximumFractionDigits: digits });
		const fmtMonths = (m) => (m >= 12 ? `${Math.floor(m / 12)} ${tMonths.year} ${(m % 12)} ${tMonths.month}` : `${m} ${tMonths.month}`);
		const tMonths = { year: "年", month: "个月" };
		const STORE_PREFIX = "dsh-finance:";
		function loadJSON(key, fallback) {
			try {
				const raw = window.localStorage.getItem(STORE_PREFIX + key);
				return raw === null ? fallback : JSON.parse(raw);
			} catch {
				return fallback;
			}
		}
		function saveJSON(key, value) {
			try {
				window.localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
			} catch {}
		}
		let idSeq = 100;
		const nextId = () => ++idSeq;
		//#endregion
		//#region shared components
		function Field({ label, value, onChange, suffix, text, placeholder, width }) {
			return h("label", { className: "fin-field", style: width ? { minWidth: width } : undefined },
				h("span", { className: "fin-field-label" }, label),
				h("span", { className: "fin-field-box" },
					h("input", {
						className: "fin-input",
						type: text ? "text" : "number",
						step: text ? undefined : "any",
						min: text ? undefined : 0,
						value,
						placeholder,
						onChange: (e) => onChange(e.target.value)
					}),
					suffix ? h("span", { className: "fin-suffix" }, suffix) : null));
		}
		function Stat({ label, value, tone }) {
			return h("div", { className: "fin-stat" + (tone ? ` fin-stat-${tone}` : "") },
				h("div", { className: "fin-stat-value" }, value),
				h("div", { className: "fin-stat-label" }, label));
		}
		function Note({ tone, children }) {
			return h("div", { className: "fin-note" + (tone ? ` fin-note-${tone}` : "") }, children);
		}
		//#endregion
		//#region compare tab
		function CompareTab({ t }) {
			const [offers, setOffers] = react.useState(() => loadJSON("compare", [
				{ id: 1, name: "商品 A", price: "25.9", qty: "500", unit: "g" },
				{ id: 2, name: "商品 B", price: "39.9", qty: "1000", unit: "g" }
			]));
			react.useEffect(() => { saveJSON("compare", offers); }, [offers]);
			const rows = offers.map((o) => {
				const price = num(o.price);
				const qty = num(o.qty);
				const unitPrice = qty > 0 && price >= 0 ? price / qty : NaN;
				return { ...o, unitPrice };
			});
			const valid = rows.filter((r) => Number.isFinite(r.unitPrice));
			const sorted = [...valid].sort((a, b) => a.unitPrice - b.unitPrice);
			const best = sorted[0];
			const worst = sorted.length > 1 ? sorted[sorted.length - 1] : undefined;
			const savingPct = best && worst && worst.unitPrice > 0 ? (1 - best.unitPrice / worst.unitPrice) * 100 : 0;
			const update = (id, patch) => setOffers((list) => list.map((o) => (o.id === id ? { ...o, ...patch } : o)));
			return h("div", { className: "fin-body" },
				h("div", { className: "fin-section" },
					h("div", { className: "fin-section-title" }, t("compare.title")),
					h("div", { className: "fin-hint" }, t("compare.hint")),
					rows.length === 0
						? h("div", { className: "fin-hint" }, t("compare.empty"))
						: h("table", { className: "fin-table" },
							h("thead", null, h("tr", null,
								h("th", null, t("compare.col.offer")),
								h("th", { className: "fin-num" }, t("compare.col.price")),
								h("th", { className: "fin-num" }, t("compare.col.qty")),
								h("th", null, t("compare.col.unit")),
								h("th", { className: "fin-num" }, t("compare.col.unitPrice")),
								h("th", null, ""))),
							h("tbody", null, rows.map((r) => h("tr", {
								key: r.id,
								className: (best && r.id === best.id ? "fin-row-best" : "") + (worst && r.id === worst.id && rows.length > 1 ? " fin-row-worst" : "")
							},
								h("td", null, h("input", {
									className: "fin-input", type: "text", value: r.name,
									onChange: (e) => update(r.id, { name: e.target.value })
								})),
								h("td", { className: "fin-num" }, h("input", {
									className: "fin-input", type: "number", step: "any", min: 0, value: r.price, style: { width: 88 },
									onChange: (e) => update(r.id, { price: e.target.value })
								})),
								h("td", { className: "fin-num" }, h("input", {
									className: "fin-input", type: "number", step: "any", min: 0, value: r.qty, style: { width: 88 },
									onChange: (e) => update(r.id, { qty: e.target.value })
								})),
								h("td", null, h("input", {
									className: "fin-input", type: "text", value: r.unit, style: { width: 64 },
									onChange: (e) => update(r.id, { unit: e.target.value })
								})),
								h("td", { className: "fin-num" }, Number.isFinite(r.unitPrice) ? `${fmtMoney(r.unitPrice, 4)}/${r.unit || t("compare.col.unit")}` : "—"),
								h("td", null, h(P.Button, {
									variant: "ghost", size: "sm",
									onClick: () => setOffers((list) => list.filter((o) => o.id !== r.id))
								}, t("common.delete"))))))),
					h("div", { className: "fin-actions" },
						h(P.Button, {
							variant: "outline", size: "sm",
							onClick: () => setOffers((list) => [...list, { id: nextId(), name: `${t("compare.offer")} ${list.length + 1}`, price: "", qty: "", unit: "个" }])
						}, t("compare.add")),
						offers.length > 0 ? h(P.Button, { variant: "ghost", size: "sm", onClick: () => setOffers([]) }, t("common.clear")) : null),
					best && worst
						? h(Note, { tone: "good" },
							t("compare.bestPre"), h("span", { className: "fin-strong" }, ` ${best.name || "—"} `),
							`(${fmtMoney(best.unitPrice, 4)}/${best.unit || t("compare.col.unit")})`, t("compare.beats"),
							h("span", { className: "fin-strong" }, ` ${worst.name || "—"} `),
							t("compare.byPct"), h("span", { className: "fin-strong" }, ` ${fmtNum(savingPct, 1)}%`))
						: null));
		}
		//#endregion
		//#region discount tab
		function fullCut(p, m, d, mode) {
			if (!(m > 0) || p < m || !(d > 0)) return p;
			if (mode === "once") return Math.max(0, p - d);
			const k = Math.floor(p / m);
			return Math.max(0, p - k * d);
		}
		function DiscountTab({ t }) {
			const [origin, setOrigin] = react.useState("100");
			const [pay, setPay] = react.useState("75");
			const [claim, setClaim] = react.useState("");
			const [price, setPrice] = react.useState("360");
			const [threshold, setThreshold] = react.useState("300");
			const [cut, setCut] = react.useState("60");
			const [mode, setMode] = react.useState("once");
			const [discZhe, setDiscZhe] = react.useState("8.5");
			const p0 = num(origin);
			const p1 = num(pay);
			const rate = p0 > 0 ? p1 / p0 : NaN;
			const zhe = Number.isFinite(rate) ? rate * 10 : NaN;
			const offPct = Number.isFinite(rate) ? (1 - rate) * 100 : NaN;
			const claimZ = num(claim);
			let verdict = null;
			if (claimZ > 0 && Number.isFinite(zhe)) {
				if (zhe <= claimZ - 0.05) verdict = { tone: "good", key: "discount.verdict.better", extra: `（${fmtNum(zhe, 2)} 折 < 标称 ${fmtNum(claimZ, 2)} 折）` };
				else if (zhe <= claimZ + 0.05) verdict = { tone: null, key: "discount.verdict.equal", extra: `（实际 ${fmtNum(zhe, 2)} 折 ≈ 标称 ${fmtNum(claimZ, 2)} 折）` };
				else verdict = { tone: "bad", key: "discount.verdict.fake", extra: `（实际 ${fmtNum(zhe, 2)} 折，比标称 ${fmtNum(claimZ, 2)} 折贵）` };
			}
			const base = num(price);
			const M = num(threshold);
			const D = num(cut);
			const Z = num(discZhe) / 10;
			const onlyCut = fullCut(base, M, D, mode);
			const onlyDisc = base * Z;
			const discThenCut = fullCut(base * Z, M, D, mode);
			const cutThenDisc = fullCut(base, M, D, mode) * Z;
		 const candidates = [
				{ key: "onlyCut", value: onlyCut },
				{ key: "onlyDisc", value: onlyDisc },
				{ key: "discThenCut", value: discThenCut },
				{ key: "cutThenDisc", value: cutThenDisc }
			];
			const bestDeal = candidates.reduce((a, b) => (b.value < a.value ? b : a), candidates[0]);
			const rowOf = (key, label, value) => h("tr", { className: key === bestDeal.key ? "fin-row-best" : undefined },
				h("td", null, label, key === bestDeal.key ? h("span", { className: "fin-badge" }, t("discount.vs.best")) : null),
				h("td", { className: "fin-num" }, fmtMoney(value)));
			return h("div", { className: "fin-body" },
				h("div", { className: "fin-section" },
					h("div", { className: "fin-section-title" }, t("discount.actual.title")),
					h("div", { className: "fin-hint" }, t("discount.actual.hint")),
					h("div", { className: "fin-grid" },
						h(Field, { label: t("discount.actual.origin"), value: origin, onChange: setOrigin, suffix: "¥" }),
						h(Field, { label: t("discount.actual.pay"), value: pay, onChange: setPay, suffix: "¥" }),
						h(Field, { label: t("discount.actual.claim"), value: claim, onChange: setClaim, suffix: t("common.zhe"), placeholder: "8.5", width: 150 })),
					Number.isFinite(zhe)
						? h("div", { className: "fin-stats" },
							h(Stat, { label: t("discount.actual.rate"), value: `${fmtNum(zhe, 2)} ${t("common.zhe")}` }),
							h(Stat, { label: t("discount.actual.off"), value: `${fmtNum(offPct, 1)}%` }),
							h(Stat, { label: t("discount.actual.saved"), value: fmtMoney(Math.max(0, p0 - p1)) }))
						: null,
					verdict ? h(Note, { tone: verdict.tone }, t(verdict.key), verdict.extra) : null),
				h("div", { className: "fin-section" },
					h("div", { className: "fin-section-title" }, t("discount.vs.title")),
					h("div", { className: "fin-hint" }, t("discount.vs.hint")),
					h("div", { className: "fin-grid" },
						h(Field, { label: t("discount.vs.origin"), value: price, onChange: setPrice, suffix: "¥" }),
						h(Field, { label: t("discount.vs.threshold"), value: threshold, onChange: setThreshold, suffix: "¥" }),
						h(Field, { label: t("discount.vs.cut"), value: cut, onChange: setCut, suffix: "¥" }),
						h(Field, { label: t("discount.vs.disc"), value: discZhe, onChange: setDiscZhe, suffix: t("common.zhe") })),
					h("div", { className: "fin-grid", style: { alignItems: "flex-end" } },
					h("span", { className: "fin-field-label", style: { paddingBottom: 7 } }, t("discount.vs.mode")),
					h("div", { className: "fin-actions" },
						h(P.Button, { variant: mode === "once" ? "primary" : "outline", size: "sm", onClick: () => setMode("once") }, t("discount.vs.once")),
						h(P.Button, { variant: mode === "each" ? "primary" : "outline", size: "sm", onClick: () => setMode("each") }, t("discount.vs.each")))),
					h("table", { className: "fin-table" },
						h("tbody", null,
							rowOf("onlyCut", t("discount.vs.onlyCut") + (mode === "each" ? t("discount.vs.eachSuffix") : ""), onlyCut),
							rowOf("onlyDisc", t("discount.vs.onlyDisc"), onlyDisc),
							rowOf("discThenCut", t("discount.vs.discThenCut"), discThenCut),
							rowOf("cutThenDisc", t("discount.vs.cutThenDisc"), cutThenDisc))),
					h(Note, null,
						t("discount.vs.conclusionPre"),
						h("span", { className: "fin-strong" }, ` ${t("discount.vs." + bestDeal.key)} `),
						t("discount.vs.conclusionPost"),
						h("span", { className: "fin-strong" }, fmtMoney(bestDeal.value)),
						t("discount.vs.saveUpTo"),
						h("span", { className: "fin-strong" }, fmtMoney(base - bestDeal.value)))));
		}
		//#endregion
		//#region subscription tab
		function SubscriptionTab({ t }) {
			const [fee, setFee] = react.useState("49.9");
			const [quota, setQuota] = react.useState("90000");
			const [coeff, setCoeff] = react.useState("1");
			const [paygPrice, setPaygPrice] = react.useState("0.01");
			const [usage, setUsage] = react.useState("20000");
			const S = num(fee);
			const Q = num(quota);
			const k = num(coeff);
			const p = num(paygPrice);
			const u = num(usage);
			const effective = k > 0 && Q > 0 ? Q / k : Infinity;
			const breakeven = p > 0 ? S / p : Infinity;
			const costSub = S;
			const costPayg = u * p;
			const cheaperSub = costPayg > costSub;
			const saving = Math.abs(costPayg - costSub);
			const over = u > effective;
			const effUnit = u > 0 && S > 0 ? S / u : NaN;
			const [subs, setSubs] = react.useState(() => loadJSON("subs", [
				{ id: 1, name: "示例·视频会员", fee: "25", uses: "8" },
				{ id: 2, name: "示例·网盘", fee: "15", uses: "2" }
			]));
			react.useEffect(() => { saveJSON("subs", subs); }, [subs]);
			const parsedSubs = subs.map((s) => {
				const f = num(s.fee);
				const n = num(s.uses);
				return { ...s, feeN: f, usesN: n, perUse: n > 0 ? f / n : NaN, yearly: f * 12 };
			});
			const totalMonthly = parsedSubs.reduce((a, b) => a + b.feeN, 0);
			const unused = parsedSubs.filter((s) => s.usesN <= 0);
			const updateSub = (id, patch) => setSubs((list) => list.map((o) => (o.id === id ? { ...o, ...patch } : o)));
			return h("div", { className: "fin-body" },
				h("div", { className: "fin-section" },
					h("div", { className: "fin-section-title" }, t("sub.vs.title")),
					h("div", { className: "fin-hint" }, t("sub.vs.hint")),
					h("div", { className: "fin-grid" },
						h(Field, { label: t("sub.vs.fee"), value: fee, onChange: setFee, suffix: "¥/月" }),
						h(Field, { label: t("sub.vs.quota"), value: quota, onChange: setQuota, suffix: t("common.times") }),
						h(Field, { label: t("sub.vs.coeff"), value: coeff, onChange: setCoeff, suffix: "×", width: 120 }),
						h(Field, { label: t("sub.vs.paygPrice"), value: paygPrice, onChange: setPaygPrice, suffix: "¥/次" }),
						h(Field, { label: t("sub.vs.usage"), value: usage, onChange: setUsage, suffix: t("common.times") })),
					h("div", { className: "fin-stats" },
						h(Stat, { label: t("sub.vs.effective"), value: Number.isFinite(effective) ? fmtNum(effective, 0) : "∞" }),
						h(Stat, { label: t("sub.vs.breakeven"), value: Number.isFinite(breakeven) ? `${fmtNum(breakeven, 0)} ${t("common.times")}` : "∞" }),
						h(Stat, { label: t("sub.vs.costSub"), value: fmtMoney(costSub) }),
						h(Stat, { label: t("sub.vs.costPayg"), value: fmtMoney(costPayg), tone: cheaperSub ? "good" : undefined })),
					u > 0 && Number.isFinite(effUnit)
						? h(Note, { tone: cheaperSub ? "good" : "bad" },
							cheaperSub
								? h(Fragment, null, t("sub.vs.verdict.subPre"), h("span", { className: "fin-strong" }, ` ${fmtMoney(saving)} `), t("sub.vs.perMonth"), t("sub.vs.verdict.subPost"))
								: h(Fragment, null, t("sub.vs.verdict.paygPre"), h("span", { className: "fin-strong" }, ` ${fmtMoney(saving)} `), t("sub.vs.perMonth"), t("sub.vs.verdict.paygPost")),
							`（${t("sub.vs.effectiveUnitPre")}${fmtMoney(effUnit, 4)}${t("sub.vs.effectiveUnitPost")}${p > 0 ? `，${t("sub.vs.paygUnit")}${fmtMoney(p, 4)}` : ""}）`)
						: null,
					over
						? h(Note, { tone: "bad" }, t("sub.vs.overRunPre"), h("span", { className: "fin-strong" }, ` ${fmtNum(u - effective, 0)} `), t("sub.vs.overRunPost"))
						: null),
				h("div", { className: "fin-section" },
					h("div", { className: "fin-section-title" }, t("sub.audit.title")),
					h("div", { className: "fin-hint" }, t("sub.audit.hint")),
					parsedSubs.length === 0
						? h("div", { className: "fin-hint" }, t("sub.audit.empty"))
						: h("table", { className: "fin-table" },
							h("thead", null, h("tr", null,
								h("th", null, t("sub.audit.col.name")),
								h("th", { className: "fin-num" }, t("sub.audit.col.fee")),
								h("th", { className: "fin-num" }, t("sub.audit.col.uses")),
								h("th", { className: "fin-num" }, t("sub.audit.col.perUse")),
								h("th", { className: "fin-num" }, t("sub.audit.col.yearly")),
								h("th", null, ""))),
							h("tbody", null, parsedSubs.map((s) => h("tr", { key: s.id, className: s.usesN <= 0 ? "fin-row-worst" : undefined },
								h("td", null, h("input", { className: "fin-input", type: "text", value: s.name, onChange: (e) => updateSub(s.id, { name: e.target.value }) })),
								h("td", { className: "fin-num" }, h("input", { className: "fin-input", type: "number", step: "any", min: 0, value: s.fee, style: { width: 76 }, onChange: (e) => updateSub(s.id, { fee: e.target.value }) })),
								h("td", { className: "fin-num" }, h("input", { className: "fin-input", type: "number", step: "any", min: 0, value: s.uses, style: { width: 76 }, onChange: (e) => updateSub(s.id, { uses: e.target.value }) })),
								h("td", { className: "fin-num" }, Number.isFinite(s.perUse) ? fmtMoney(s.perUse) : t("sub.audit.unused")),
								h("td", { className: "fin-num" }, fmtMoney(s.yearly)),
								h("td", null, h(P.Button, { variant: "ghost", size: "sm", onClick: () => setSubs((list) => list.filter((o) => o.id !== s.id)) }, t("common.delete"))))))),
					h("div", { className: "fin-actions" },
						h(P.Button, {
							variant: "outline", size: "sm",
							onClick: () => setSubs((list) => [...list, { id: nextId(), name: t("sub.audit.newItem"), fee: "", uses: "" }])
						}, t("sub.audit.add"))),
					parsedSubs.length > 0
						? h("div", { className: "fin-stats" },
							h(Stat, { label: t("sub.audit.totalMonthly"), value: fmtMoney(totalMonthly) }),
							h(Stat, { label: t("sub.audit.totalYearly"), value: fmtMoney(totalMonthly * 12) }))
						: null,
					unused.length > 0
						? h(Note, { tone: "bad" }, t("sub.audit.unusedNotePre"), h("span", { className: "fin-strong" }, ` ${unused.map((s) => s.name || "—").join("、")} `), t("sub.audit.unusedNotePost"))
						: null));
		}
		//#endregion
		//#region plan tab
		function futureValue(p0, pmt, annualRate, months) {
			const i = annualRate / 100 / 12;
			if (months <= 0) return p0;
			if (i === 0) return p0 + pmt * months;
			return p0 * Math.pow(1 + i, months) + pmt * ((Math.pow(1 + i, months) - 1) / i);
		}
		function PlanTab({ t }) {
			const [cp, setCp] = react.useState({ p0: "10000", pmt: "2000", rate: "3", years: "10" });
			const [goal, setGoal] = react.useState({ target: "200000", p0: "10000", pmt: "2000", rate: "3" });
			const [budget, setBudget] = react.useState({ income: "10000", needs: "50", wants: "30", save: "20" });
			const [loan, setLoan] = react.useState({ principal: "500000", rate: "4.2", years: "30" });
			const p0 = num(cp.p0);
			const pmt = num(cp.pmt);
			const rate = num(cp.rate);
			const years = num(cp.years);
			const months = Math.max(0, Math.round(years * 12));
			const fv = futureValue(p0, pmt, rate, months);
			const invested = p0 + pmt * months;
			const gain = fv - invested;
			const shownYears = Math.min(Math.ceil(months / 12) || 0, 30);
			const gT = num(goal.target);
			const gP0 = num(goal.p0);
			const gPmt = num(goal.pmt);
			const gRate = num(goal.rate);
			let needMonths = NaN;
			{
				const i = gRate / 100 / 12;
				if (gT <= gP0) needMonths = 0;
				else if (i === 0) {
					if (gPmt > 0) needMonths = Math.ceil((gT - gP0) / gPmt);
				} else {
					const a = (gT * i + gPmt) / (gP0 * i + gPmt);
					if (a > 0) {
						const n = Math.log(a) / Math.log(1 + i);
						if (Number.isFinite(n) && n > 0) needMonths = Math.ceil(n);
					}
				}
			}
			const income = num(budget.income);
			const rN = num(budget.needs);
			const rW = num(budget.wants);
			const rS = num(budget.save);
			const sumR = rN + rW + rS;
			const L = num(loan.principal);
			const lr = num(loan.rate) / 100 / 12;
			const ln = Math.max(1, Math.round(num(loan.years) * 12));
			const monthlyEq = lr > 0 ? (L * lr) / (1 - Math.pow(1 + lr, -ln)) : L / ln;
			const eqTotal = monthlyEq * ln;
			const eqInterest = eqTotal - L;
			const epMonthlyBase = L / ln;
			const epFirst = epMonthlyBase + L * lr;
			const epLast = epMonthlyBase + epMonthlyBase * lr;
			const epInterest = (L * lr * (ln + 1)) / 2;
			const loanDiff = eqInterest - epInterest;
			return h("div", { className: "fin-body" },
				h("div", { className: "fin-section" },
					h("div", { className: "fin-section-title" }, t("plan.compound.title")),
					h("div", { className: "fin-grid" },
						h(Field, { label: t("plan.compound.initial"), value: cp.p0, onChange: (v) => setCp({ ...cp, p0: v }), suffix: "¥" }),
						h(Field, { label: t("plan.compound.monthly"), value: cp.pmt, onChange: (v) => setCp({ ...cp, pmt: v }), suffix: "¥/月" }),
						h(Field, { label: t("plan.compound.rate"), value: cp.rate, onChange: (v) => setCp({ ...cp, rate: v }), suffix: "%/年", width: 110 }),
						h(Field, { label: t("plan.compound.years"), value: cp.years, onChange: (v) => setCp({ ...cp, years: v }), suffix: t("common.years"), width: 110 })),
					h("div", { className: "fin-stats" },
						h(Stat, { label: t("plan.compound.fv"), value: fmtMoney(fv, 0), tone: "good" }),
						h(Stat, { label: t("plan.compound.invested"), value: fmtMoney(invested, 0) }),
						h(Stat, { label: t("plan.compound.interest"), value: fmtMoney(gain, 0), tone: "good" })),
					shownYears > 1
						? h("table", { className: "fin-table" },
							h("thead", null, h("tr", null, h("th", null, t("common.year")), h("th", { className: "fin-num" }, t("plan.compound.yearEnd")))),
							h("tbody", null, Array.from({ length: shownYears }, (_, idx) => {
								const y = idx + 1;
								return h("tr", { key: y },
									h("td", null, `${y}`),
									h("td", { className: "fin-num" }, fmtMoney(futureValue(p0, pmt, rate, Math.min(y * 12, months)), 0)));
							})))
						: null),
				h("div", { className: "fin-section" },
					h("div", { className: "fin-section-title" }, t("plan.goal.title")),
					h("div", { className: "fin-grid" },
						h(Field, { label: t("plan.goal.target"), value: goal.target, onChange: (v) => setGoal({ ...goal, target: v }), suffix: "¥" }),
						h(Field, { label: t("plan.compound.initial"), value: goal.p0, onChange: (v) => setGoal({ ...goal, p0: v }), suffix: "¥" }),
						h(Field, { label: t("plan.compound.monthly"), value: goal.pmt, onChange: (v) => setGoal({ ...goal, pmt: v }), suffix: "¥/月" }),
						h(Field, { label: t("plan.compound.rate"), value: goal.rate, onChange: (v) => setGoal({ ...goal, rate: v }), suffix: "%/年", width: 110 })),
					Number.isFinite(needMonths)
						? h(Note, { tone: "good" }, t("plan.goal.needPre"), h("span", { className: "fin-strong" }, ` ${fmtMonths(needMonths)} `), t("plan.goal.needPost"))
						: h(Note, { tone: "bad" }, t("plan.goal.unreachable"))),
				h("div", { className: "fin-section" },
					h("div", { className: "fin-section-title" }, t("plan.budget.title")),
					h("div", { className: "fin-grid" },
						h(Field, { label: t("plan.budget.income"), value: budget.income, onChange: (v) => setBudget({ ...budget, income: v }), suffix: "¥/月" }),
						h(Field, { label: t("plan.budget.needsPct"), value: budget.needs, onChange: (v) => setBudget({ ...budget, needs: v }), suffix: "%", width: 110 }),
						h(Field, { label: t("plan.budget.wantsPct"), value: budget.wants, onChange: (v) => setBudget({ ...budget, wants: v }), suffix: "%", width: 110 }),
						h(Field, { label: t("plan.budget.savePct"), value: budget.save, onChange: (v) => setBudget({ ...budget, save: v }), suffix: "%", width: 110 })),
					Math.round(sumR) !== 100 ? h(Note, { tone: "bad" }, t("plan.budget.sumWarnPre"), h("span", { className: "fin-strong" }, ` ${fmtNum(sumR - 100, 1)}% `), t("plan.budget.sumWarnPost")) : null,
					h("div", { className: "fin-stats" },
						h(Stat, { label: t("plan.budget.needs"), value: fmtMoney((income * rN) / 100, 0) }),
						h(Stat, { label: t("plan.budget.wants"), value: fmtMoney((income * rW) / 100, 0) }),
						h(Stat, { label: t("plan.budget.savings"), value: fmtMoney((income * rS) / 100, 0), tone: "good" }))),
				h("div", { className: "fin-section" },
					h("div", { className: "fin-section-title" }, t("plan.loan.title")),
					h("div", { className: "fin-grid" },
						h(Field, { label: t("plan.loan.principal"), value: loan.principal, onChange: (v) => setLoan({ ...loan, principal: v }), suffix: "¥" }),
						h(Field, { label: t("plan.loan.rate"), value: loan.rate, onChange: (v) => setLoan({ ...loan, rate: v }), suffix: "%/年", width: 120 }),
						h(Field, { label: t("plan.loan.years"), value: loan.years, onChange: (v) => setLoan({ ...loan, years: v }), suffix: t("common.years"), width: 120 })),
					h("table", { className: "fin-table" },
						h("thead", null, h("tr", null,
							h("th", null, t("plan.loan.col.mode")),
							h("th", { className: "fin-num" }, t("plan.loan.col.monthly")),
							h("th", { className: "fin-num" }, t("plan.loan.col.totalInterest")))),
						h("tbody", null,
							h("tr", null,
								h("td", null, t("plan.loan.equalPayment")),
								h("td", { className: "fin-num" }, fmtMoney(monthlyEq)),
								h("td", { className: "fin-num" }, fmtMoney(eqInterest, 0))),
							h("tr", null,
								h("td", null, t("plan.loan.equalPrincipal")),
								h("td", { className: "fin-num" }, `${fmtMoney(epFirst, 0)} → ${fmtMoney(epLast, 0)}`),
								h("td", { className: "fin-num" }, fmtMoney(epInterest, 0))))),
					loanDiff > 0.01
						? h(Note, null, t("plan.loan.diffPre"), h("span", { className: "fin-strong" }, ` ${fmtMoney(loanDiff, 0)} `), t("plan.loan.diffPost"))
						: null),
				h("div", { className: "fin-foot" }, t("plan.disclaimer")));
		}
		//#endregion
		//#region modal & footer action
		const TABS = [
			["compare", "tab.compare"],
			["discount", "tab.discount"],
			["subscription", "tab.subscription"],
			["plan", "tab.plan"]
		];
		function FinanceModal({ onClose, t }) {
			const [tab, setTab] = react.useState("compare");
			return h(P.Modal, {
				open: true,
				onClose,
				title: t("modal.title"),
				closeLabel: t("modal.close"),
				className: "fin-modal",
				children: h("div", { className: "fin-root" },
					h("div", { className: "fin-tabs" }, TABS.map(([id, key]) => h("button", {
						key: id,
						type: "button",
						className: "fin-tab" + (tab === id ? " fin-tab-active" : ""),
						onClick: () => setTab(id)
					}, t(key)))),
					tab === "compare" ? h(CompareTab, { t })
					: tab === "discount" ? h(DiscountTab, { t })
					: tab === "subscription" ? h(SubscriptionTab, { t })
					: h(PlanTab, { t }),
					h("div", { className: "fin-foot" }, t("modal.privacy"))),
				footer: h(P.Button, { variant: "primary", onClick: onClose }, t("modal.close"))
			});
		}
		function FinanceFooterAction({ wide, t }) {
			const [open, setOpen] = react.useState(false);
			return h(Fragment, null,
				h("button", {
					type: "button",
					className: "fin-fab",
					"aria-label": t("fab.aria"),
					title: t("fab.aria"),
					onClick: () => setOpen(true)
				},
					h(P.IconDataOutline16, { size: 16 }),
					wide ? h("span", null, t("fab.label")) : null),
				open ? h(FinanceModal, { onClose: () => setOpen(false), t }) : null);
		}
		//#endregion
		//#region locales
		const NS = "finance";
		const zh = {
			"fab.label": "财务",
			"fab.aria": "打开财务工具",
			"modal.title": "财务工具",
			"modal.close": "关闭",
			"modal.privacy": "所有数据仅保存在浏览器本地（localStorage），不会上传。",
			"tab.compare": "比价",
			"tab.discount": "折扣",
			"tab.subscription": "订阅",
			"tab.plan": "规划",
			"common.delete": "删除",
			"common.clear": "清空",
			"common.zhe": "折",
			"common.times": "次",
			"common.years": "年",
			"common.year": "年份",
			"compare.title": "单价比较",
			"compare.hint": "填写各商品的价格与数量（同一计量单位），按单价自动排序：绿色最划算，红色最贵。",
			"compare.empty": "暂无商品，点击「添加一行」开始比价。",
			"compare.add": "添加一行",
			"compare.offer": "商品",
			"compare.col.offer": "名称",
			"compare.col.price": "价格",
			"compare.col.qty": "数量",
			"compare.col.unit": "单位",
			"compare.col.unitPrice": "单价",
			"compare.bestPre": "最划算：",
			"compare.beats": "比",
			"compare.byPct": "便宜约",
			"discount.actual.title": "实际折扣验证",
			"discount.actual.hint": "用「原价 × 到手价」算出真实折扣，可再填标称折扣判断促销是否名不副实。",
			"discount.actual.origin": "原价",
			"discount.actual.pay": "到手价",
			"discount.actual.claim": "标称折扣",
			"discount.actual.rate": "实际折扣",
			"discount.actual.off": "相当于降价",
			"discount.actual.saved": "立省",
			"discount.verdict.better": "优惠力度超过标称，是真便宜。",
			"discount.verdict.equal": "实际折扣与标称基本一致。",
			"discount.verdict.fake": "实际折扣不及标称，注意先涨后降。",
			"discount.vs.title": "满减 vs 折扣",
			"discount.vs.hint": "同一商品按四种优惠路径分别计算到手价，自动标出最省的一种。",
			"discount.vs.origin": "商品原价",
			"discount.vs.threshold": "满减门槛",
			"discount.vs.cut": "满减金额",
			"discount.vs.disc": "折扣力度",
			"discount.vs.mode": "满减方式",
			"discount.vs.once": "一次性满减",
			"discount.vs.each": "每满即减",
			"discount.vs.eachSuffix": "（每满）",
			"discount.vs.onlyCut": "仅满减",
			"discount.vs.onlyDisc": "仅折扣",
			"discount.vs.discThenCut": "先打折再满减",
			"discount.vs.cutThenDisc": "先满减再打折",
			"discount.vs.best": "最省",
			"discount.vs.conclusionPre": "结论：选",
			"discount.vs.conclusionPost": "，到手约",
			"discount.vs.saveUpTo": "，比原价省",
			"sub.vs.title": "订阅 vs 按量付费",
			"sub.vs.hint": "算清订阅的「有效额度」与按量计费的平衡点。抵扣系数：不同项目按不同倍数扣额度（如部分平台第三方模型约 5×），标称额度要除以它。",
			"sub.vs.fee": "订阅费",
			"sub.vs.quota": "标称月额度",
			"sub.vs.coeff": "抵扣系数",
			"sub.vs.paygPrice": "按量单价",
			"sub.vs.usage": "预计月用量",
			"sub.vs.effective": "有效额度",
			"sub.vs.breakeven": "盈亏平衡用量",
			"sub.vs.costSub": "订阅月成本",
			"sub.vs.costPayg": "按量月成本",
			"sub.vs.perMonth": "元/月",
			"sub.vs.verdict.subPre": "订阅更划算，每月约省",
			"sub.vs.verdict.subPost": "。",
			"sub.vs.verdict.paygPre": "按量更划算，每月约省",
			"sub.vs.verdict.paygPost": "，暂不必订阅。",
			"sub.vs.effectiveUnitPre": "订阅折合单价 ",
			"sub.vs.effectiveUnitPost": "/次",
			"sub.vs.paygUnit": "，按量单价 ",
			"sub.vs.overRunPre": "注意：预计用量已超出有效额度约",
			"sub.vs.overRunPost": "次，超额部分会限流或另计费。",
			"sub.audit.title": "订阅审计",
			"sub.audit.hint": "列出你所有的定期订阅和每月实际使用次数，算出每次使用成本——用过少的就是退订候选。",
			"sub.audit.empty": "暂无订阅记录，点击「添加订阅」。",
			"sub.audit.add": "添加订阅",
			"sub.audit.newItem": "新订阅",
			"sub.audit.col.name": "名称",
			"sub.audit.col.fee": "月费",
			"sub.audit.col.uses": "月使用次数",
			"sub.audit.col.perUse": "每次成本",
			"sub.audit.col.yearly": "年成本",
			"sub.audit.unused": "本月未用",
			"sub.audit.totalMonthly": "订阅月合计",
			"sub.audit.totalYearly": "订阅年合计",
			"sub.audit.unusedNotePre": "本月未使用：",
			"sub.audit.unusedNotePost": "——如果下个月仍用不上，考虑退订。",
			"plan.compound.title": "定投复利",
			"plan.compound.initial": "现有本金",
			"plan.compound.monthly": "每月定投",
			"plan.compound.rate": "年化利率",
			"plan.compound.years": "期限",
			"plan.compound.fv": "期末终值",
			"plan.compound.invested": "累计投入",
			"plan.compound.interest": "投资收益",
			"plan.compound.yearEnd": "年末资产",
			"plan.goal.title": "储蓄目标",
			"plan.goal.target": "目标金额",
			"plan.goal.needPre": "按当前方案，约需",
			"plan.goal.needPost": "即可达成目标。",
			"plan.goal.unreachable": "按当前参数无法达成：请提高月定投、降低目标或接受更长时间。",
			"plan.budget.title": "预算分配（默认 50/30/20）",
			"plan.budget.income": "月收入",
			"plan.budget.needsPct": "必需占比",
			"plan.budget.wantsPct": "想要占比",
			"plan.budget.savePct": "储蓄占比",
			"plan.budget.needs": "必需开支",
			"plan.budget.wants": "弹性消费",
			"plan.budget.savings": "储蓄投资",
			"plan.budget.sumWarnPre": "三项比例合计为",
			"plan.budget.sumWarnPost": "%，不等于 100%，请调整。",
			"plan.loan.title": "贷款月供",
			"plan.loan.principal": "贷款本金",
			"plan.loan.rate": "年利率",
			"plan.loan.years": "贷款期限",
			"plan.loan.col.mode": "还款方式",
			"plan.loan.col.monthly": "月供",
			"plan.loan.col.totalInterest": "总利息",
			"plan.loan.equalPayment": "等额本息",
			"plan.loan.equalPrincipal": "等额本金（首月→末月）",
			"plan.loan.diffPre": "等额本金比等额本息少还利息约",
			"plan.loan.diffPost": "，但前期月供压力更大。",
			"plan.disclaimer": "以上均为固定利率静态估算，不构成任何投资建议；实际收益与利率、通胀、费用有关。"
		};
		const en = {
			"fab.label": "Finance",
			"fab.aria": "Open finance tools",
			"modal.title": "Finance Tools",
			"modal.close": "Close",
			"modal.privacy": "All data stays in your browser (localStorage); nothing is uploaded.",
			"tab.compare": "Compare",
			"tab.discount": "Discount",
			"tab.subscription": "Subscriptions",
			"tab.plan": "Planning",
			"common.delete": "Delete",
			"common.clear": "Clear",
			"common.zhe": "zhe",
			"common.times": "uses",
			"common.years": "yr",
			"common.year": "Year",
			"compare.title": "Unit price comparison",
			"compare.hint": "Enter price and quantity per item (same unit). Sorted by unit price: green = best, red = worst.",
			"compare.empty": "No items yet — click \"Add row\" to start.",
			"compare.add": "Add row",
			"compare.offer": "Item",
			"compare.col.offer": "Name",
			"compare.col.price": "Price",
			"compare.col.qty": "Qty",
			"compare.col.unit": "Unit",
			"compare.col.unitPrice": "Unit price",
			"compare.bestPre": "Best value: ",
			"compare.beats": " vs ",
			"compare.byPct": ", about ",
			"discount.actual.title": "Real discount check",
			"discount.actual.hint": "Compute the true discount from list price × final price; optionally compare with the advertised discount.",
			"discount.actual.origin": "List price",
			"discount.actual.pay": "Final price",
			"discount.actual.claim": "Advertised",
			"discount.actual.rate": "Real discount",
			"discount.actual.off": "Effective reduction",
			"discount.actual.saved": "You save",
			"discount.verdict.better": "Better than advertised — genuinely cheap.",
			"discount.verdict.equal": "Matches the advertised discount.",
			"discount.verdict.fake": "Worse than advertised — watch for fake discounts.",
			"discount.vs.title": "Full-cut vs percentage discount",
			"discount.vs.hint": "Four redemption paths computed side by side; the cheapest is highlighted.",
			"discount.vs.origin": "Item price",
			"discount.vs.threshold": "Cut threshold",
			"discount.vs.cut": "Cut amount",
			"discount.vs.disc": "Discount",
			"discount.vs.mode": "Cut mode",
			"discount.vs.once": "Apply once",
			"discount.vs.each": "Per threshold",
			"discount.vs.eachSuffix": " (per)",
			"discount.vs.onlyCut": "Full-cut only",
			"discount.vs.onlyDisc": "Discount only",
			"discount.vs.discThenCut": "Discount then cut",
			"discount.vs.cutThenDisc": "Cut then discount",
			"discount.vs.best": "Best",
			"discount.vs.conclusionPre": "Pick ",
			"discount.vs.conclusionPost": ", paying about ",
			"discount.vs.saveUpTo": ", saving up to ",
			"sub.vs.title": "Subscription vs pay-as-you-go",
			"sub.vs.hint": "Effective quota = advertised quota ÷ deduction coefficient (some platforms deduct third-party models at ~5×). Breakeven usage = fee ÷ pay-as-you-go price.",
			"sub.vs.fee": "Subscription fee",
			"sub.vs.quota": "Advertised quota",
			"sub.vs.coeff": "Coefficient",
			"sub.vs.paygPrice": "PAYG price",
			"sub.vs.usage": "Expected monthly usage",
			"sub.vs.effective": "Effective quota",
			"sub.vs.breakeven": "Breakeven usage",
			"sub.vs.costSub": "Subscription / mo",
			"sub.vs.costPayg": "PAYG / mo",
			"sub.vs.perMonth": "/mo",
			"sub.vs.verdict.subPre": "Subscription wins, saving about ",
			"sub.vs.verdict.subPost": ".",
			"sub.vs.verdict.paygPre": "Pay-as-you-go wins, saving about ",
			"sub.vs.verdict.paygPost": " — no need to subscribe yet.",
			"sub.vs.effectiveUnitPre": "Subscription unit cost ",
			"sub.vs.effectiveUnitPost": " per use",
			"sub.vs.paygUnit": ", PAYG ",
			"sub.vs.overRunPre": "Heads up: expected usage exceeds the effective quota by ~",
			"sub.vs.overRunPost": " uses; the overflow may be throttled or billed.",
			"sub.audit.title": "Subscription audit",
			"sub.audit.hint": "List recurring subscriptions and monthly usage; cost per use exposes cancel candidates.",
			"sub.audit.empty": "No subscriptions yet — click \"Add\".",
			"sub.audit.add": "Add",
			"sub.audit.newItem": "New subscription",
			"sub.audit.col.name": "Name",
			"sub.audit.col.fee": "Monthly",
			"sub.audit.col.uses": "Uses / mo",
			"sub.audit.col.perUse": "Cost / use",
			"sub.audit.col.yearly": "Yearly",
			"sub.audit.unused": "unused",
			"sub.audit.totalMonthly": "Monthly total",
			"sub.audit.totalYearly": "Yearly total",
			"sub.audit.unusedNotePre": "Not used this month: ",
			"sub.audit.unusedNotePost": " — consider cancelling if that repeats.",
			"plan.compound.title": "Compound savings",
			"plan.compound.initial": "Initial amount",
			"plan.compound.monthly": "Monthly deposit",
			"plan.compound.rate": "Annual rate",
			"plan.compound.years": "Years",
			"plan.compound.fv": "Future value",
			"plan.compound.invested": "Total invested",
			"plan.compound.interest": "Earnings",
			"plan.compound.yearEnd": "Year-end value",
			"plan.goal.title": "Savings goal",
			"plan.goal.target": "Target amount",
			"plan.goal.needPre": "At this pace you need about ",
			"plan.goal.needPost": " to reach the goal.",
			"plan.goal.unreachable": "Unreachable with these inputs: raise the deposit, lower the target, or allow more time.",
			"plan.budget.title": "Budget split (default 50/30/20)",
			"plan.budget.income": "Monthly income",
			"plan.budget.needsPct": "Needs %",
			"plan.budget.wantsPct": "Wants %",
			"plan.budget.savePct": "Savings %",
			"plan.budget.needs": "Needs",
			"plan.budget.wants": "Wants",
			"plan.budget.savings": "Savings",
			"plan.budget.sumWarnPre": "Ratios sum to ",
			"plan.budget.sumWarnPost": "%, not 100% — please adjust.",
			"plan.loan.title": "Loan payment",
			"plan.loan.principal": "Principal",
			"plan.loan.rate": "Annual rate",
			"plan.loan.years": "Term",
			"plan.loan.col.mode": "Repayment",
			"plan.loan.col.monthly": "Monthly",
			"plan.loan.col.totalInterest": "Total interest",
			"plan.loan.equalPayment": "Equal payment",
			"plan.loan.equalPrincipal": "Equal principal (first → last)",
			"plan.loan.diffPre": "Equal principal saves about ",
			"plan.loan.diffPost": " in interest, with heavier early payments.",
			"plan.disclaimer": "Static fixed-rate estimates only; not investment advice."
		};
		//#endregion
		//#region plugin body
		const inject = ["slots", "locale"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ui-finance: dictionaries");
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "finance",
				locale: NS
			}, FinanceFooterAction));
		}
		//#endregion
		exports.FinanceModal = FinanceModal;
		exports.FinanceFooterAction = FinanceFooterAction;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
