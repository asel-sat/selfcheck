// Подготовка .docx перед чтением через mammoth (общая для tests/ и written/).
// mammoth пропускает формулы Word (OMML, «Вставка → Уравнение») целиком, а формулы MathType / Equation 3.0
// отдает картинкой. Здесь формулы заменяются обычным текстом (дробь a/b, степень x^2, корень √x),
// формулы-объекты — меткой «[формула]», подчеркнутые пробелы (место для ответа) — «___».
// Нужен JSZip; без него или при любой ошибке возвращается исходный файл.
(function (root) {
  const M = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const PIC_FORMULA = '[формула]';

  const kids = (el, name) => [...el.childNodes].filter((n) => n.nodeType === 1 && n.namespaceURI === M && n.localName === name);
  const kid = (el, name) => kids(el, name)[0] || null;
  const prop = (el, prName, name) => { const pr = kid(el, prName); const p = pr && kid(pr, name); return p ? p.getAttributeNS(M, 'val') ?? p.getAttribute('m:val') : null; };
  const simple = (s) => /^[\p{L}\p{N}.,′″'°]*$/u.test(s) || /^\(.*\)$/.test(s) && balanced(s.slice(1, -1));
  const balanced = (s) => { let d = 0; for (const c of s) { if (c === '(') d++; else if (c === ')' && --d < 0) return false; } return d === 0; };
  const wrap = (s) => (simple(s) ? s : '(' + s + ')');

  function lin(el) {
    if (!el) return '';
    if (el.nodeType !== 1) return '';
    if (el.namespaceURI !== M) return [...el.childNodes].map(lin).join('');
    const n = el.localName;
    if (/Pr$/.test(n)) return '';
    const e = () => lin(kid(el, 'e'));
    switch (n) {
      case 't': return el.textContent;
      case 'f': return wrap(lin(kid(el, 'num'))) + '/' + wrap(lin(kid(el, 'den')));
      case 'sSup': return wrap(e()) + '^' + wrap(lin(kid(el, 'sup')));
      case 'sSub': return e() + '_' + wrap(lin(kid(el, 'sub')));
      case 'sSubSup': return e() + '_' + wrap(lin(kid(el, 'sub'))) + '^' + wrap(lin(kid(el, 'sup')));
      case 'sPre': return '_' + wrap(lin(kid(el, 'sub'))) + '^' + wrap(lin(kid(el, 'sup'))) + e();
      case 'rad': {
        const deg = lin(kid(el, 'deg')).trim();
        const sign = !deg || deg === '2' ? '√' : deg === '3' ? '∛' : deg === '4' ? '∜' : deg + '√';
        return sign + wrap(e());
      }
      case 'd': {
        const beg = prop(el, 'dPr', 'begChr'), end = prop(el, 'dPr', 'endChr'), sep = prop(el, 'dPr', 'sepChr');
        return (beg ?? '(') + kids(el, 'e').map(lin).join(sep ?? '|') + (end ?? ')');
      }
      case 'nary': {
        const chr = prop(el, 'naryPr', 'chr') || '∫';
        const sub = lin(kid(el, 'sub')), sup = lin(kid(el, 'sup'));
        return chr + (sub ? '_' + wrap(sub) : '') + (sup ? '^' + wrap(sup) : '') + ' ' + e();
      }
      case 'func': {
        const arg = e();
        return lin(kid(el, 'fName')) + (/^[(\[{|]/.test(arg) ? arg : '(' + arg + ')');
      }
      case 'limLow': return e() + '_' + wrap(lin(kid(el, 'lim')));
      case 'limUpp': return e() + '^' + wrap(lin(kid(el, 'lim')));
      case 'acc': return e() + (prop(el, 'accPr', 'chr') || '̂');
      case 'bar': return e() + '̅';
      case 'm': return '[' + kids(el, 'mr').map((r) => kids(r, 'e').map(lin).join(', ')).join('; ') + ']';
      case 'eqArr': return kids(el, 'e').map(lin).join('; ');
      case 'oMathPara': return kids(el, 'oMath').map(lin).join('; ');
      default: return [...el.childNodes].map(lin).join('');
    }
  }

  function textRun(doc, text) {
    const r = doc.createElementNS(W, 'w:r');
    const t = doc.createElementNS(W, 'w:t');
    t.setAttribute('xml:space', 'preserve');
    t.textContent = text;
    r.appendChild(t);
    return r;
  }

  function transformXml(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) return null;
    let changed = false;
    // 1) Word equations → plain text
    const maths = [...doc.getElementsByTagNameNS(M, 'oMathPara'), ...doc.getElementsByTagNameNS(M, 'oMath')]
      .filter((el) => !(el.localName === 'oMath' && el.parentNode && el.parentNode.namespaceURI === M));
    for (const el of maths) {
      if (!el.parentNode) continue;
      const s = lin(el).replace(/\s+/g, ' ').trim();
      el.parentNode.replaceChild(textRun(doc, s ? ' ' + s + ' ' : ''), el);
      changed = true;
    }
    // 2) MathType / Equation 3.0 objects → «[формула]»
    for (const ole of [...doc.getElementsByTagName('o:OLEObject')]) {
      if (!/^Equation\./i.test(ole.getAttribute('ProgID') || '')) continue;
      let obj = ole; while (obj && !(obj.namespaceURI === W && obj.localName === 'object')) obj = obj.parentNode;
      if (!obj || !obj.parentNode) continue;
      const t = doc.createElementNS(W, 'w:t'); t.setAttribute('xml:space', 'preserve'); t.textContent = ' ' + PIC_FORMULA + ' ';
      obj.parentNode.replaceChild(t, obj);
      changed = true;
    }
    // 3) underlined blanks (spaces or tabs) → «___»
    for (const r of [...doc.getElementsByTagNameNS(W, 'r')]) {
      const rPr = [...r.childNodes].find((n) => n.localName === 'rPr');
      const u = rPr && [...rPr.childNodes].find((n) => n.localName === 'u');
      if (!u || /^none$/i.test(u.getAttributeNS(W, 'val') || u.getAttribute('w:val') || '')) continue;
      const content = [...r.childNodes].filter((n) => n.nodeType === 1 && n !== rPr);
      if (!content.length || !content.every((n) => n.localName === 'tab' || (n.localName === 't' && /^[\s ]*$/.test(n.textContent)))) continue;
      const len = content.reduce((a, n) => a + (n.localName === 'tab' ? 4 : n.textContent.length), 0);
      if (len < 2) continue;
      content.forEach((n) => r.removeChild(n));
      const t = doc.createElementNS(W, 'w:t'); t.setAttribute('xml:space', 'preserve'); t.textContent = ' ___ ';
      r.appendChild(t);
      changed = true;
    }
    return changed ? new XMLSerializer().serializeToString(doc) : null;
  }

  async function prepDocx(buf) {
    if (!root.JSZip || !root.DOMParser) return buf;
    try {
      const zip = await root.JSZip.loadAsync(buf);
      const f = zip.file('word/document.xml'); if (!f) return buf;
      const xml = await f.async('string');
      if (!/<m:oMath|Equation\.|<w:u /.test(xml)) return buf;
      const out = transformXml(xml); if (!out) return buf;
      zip.file('word/document.xml', out);
      return await zip.generateAsync({ type: 'arraybuffer' });
    } catch (e) { return buf; }
  }

  root.DocxPrep = { prepDocx, transformXml, linearize: lin, PIC_FORMULA };
})(typeof window !== 'undefined' ? window : globalThis);
