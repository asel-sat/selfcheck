"""Собирает тестовые .docx для проверки формул и пропусков: python3 make_fixtures.py <папка>.
mechmath.docx: формулы Word (OMML), формула MathType (объект Equation), знаки × ÷ · : + − в тексте.
philology.docx: задания «вставьте слово» с ___, …, подчеркнутыми пробелами и двумя пропусками."""
import sys, zipfile, os
from xml.sax.saxutils import escape

def t(s): return f'<w:r><w:t xml:space="preserve">{escape(s)}</w:t></w:r>'
def u_blank(n=8): return f'<w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">{" " * n}</w:t></w:r>'
def p(*runs): return '<w:p>' + ''.join(runs) + '</w:p>'
# OMML helpers
def mr(s): return f'<m:r><m:t>{escape(s)}</m:t></m:r>'
def e(*x): return '<m:e>' + ''.join(x) + '</m:e>'
def frac(a, b): return f'<m:f><m:num>{a}</m:num><m:den>{b}</m:den></m:f>'
def sup(base, s): return f'<m:sSup>{e(base)}<m:sup>{s}</m:sup></m:sSup>'
def rad(x): return f'<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/>{e(x)}</m:rad>'
def integral(a, b, x): return f'<m:nary><m:naryPr><m:limLoc m:val="subSup"/></m:naryPr><m:sub>{a}</m:sub><m:sup>{b}</m:sup>{e(x)}</m:nary>'
def om(*x): return '<m:oMath>' + ''.join(x) + '</m:oMath>'
def ole(): return ('<w:r><w:object><v:shape id="_x0000_i1025" type="#_x0000_t75" style="width:60pt;height:18pt"/>'
                   '<o:OLEObject Type="Embed" ProgID="Equation.DSMT4" ShapeID="_x0000_i1025" DrawAspect="Content" ObjectID="_1"/></w:object></w:r>')

def q(n, text_runs, opts, key, w='1.25'):
    out = [p(t(f'№ {n}.')), p(t(f'Вопрос с одним верным ответом ({w} из 100)')), p(*text_runs)]
    for L, o in zip('ABCDE', opts): out.append(p(t(f'{L}. '), *(o if isinstance(o, tuple) else (t(o),))))
    out.append(p(t(f'Ответ - {key}')))
    return out

MECH = [p(t('Комплект: "Математический анализ (проверка формул)"'))]
MECH += q(1, [t('Какое выражение соответствует произведению a и b?')],
          [(om(mr('a×b')),), (om(mr('a÷b')),), (om(mr('a+b')),), (om(mr('a−b')),), (om(sup(mr('a'), mr('b'))),)], 'A')
MECH += q(2, [t('Как записывается частное x и y?')], ['x · y', 'x : y', 'x + y', 'x − y', 'x - y + 1'], 'B')
MECH += q(3, [t('Найдите значение выражения 12 × 3')], ['36', '4', '15', '9', '0'], 'A')
MECH += q(4, [t('Найдите значение выражения 12 ÷ 3')], ['36', '4', '15', '9', '0'], 'B')
MECH += q(5, [t('Найдите сумму '), om(frac(mr('1'), mr('2')), mr('+'), frac(mr('1'), mr('3')))],
          [(om(frac(mr('5'), mr('6'))),), (om(frac(mr('2'), mr('5'))),), (om(frac(mr('1'), mr('6'))),), '1', (om(frac(mr('2'), mr('3'))),)], 'A')
MECH += q(6, [t('Вычислите интеграл '), om(integral(mr('0'), mr('1'), mr('x'), ) + mr('dx'))], ['1/2', '1', '0', '2', '1/3'], 'A')
MECH += q(7, [t('Найдите значение '), om(rad(mr('16')))], ['4', '8', '16', '2', '−4'], 'A')
MECH += q(8, [t('Решите уравнение '), ole()], ['x = 1', 'x = 2', 'x = 3', 'x = −1', 'x = 0'], 'B')
MECH += q(9, [t('Чему равно произведение 2 и 3 (настоящий повтор вариантов)?')], ['2 × 3', '2·3', '5', '1', '8'], 'A')

PHIL = [p(t('Комплект: "Русский язык (задания на пропуск)"'))]
PHIL += q(1, [t('Вставьте пропущенное слово: Он ___ домой поздно вечером.')], ['пришел', 'пришла', 'пришли', 'приходят', 'придем'], 'A')
PHIL += q(2, [t('Вставьте пропущенное слово: Мы … в библиотеке каждый день.')], ['занимаемся', 'занимается', 'занимаешься', 'занимаюсь', 'занимались бы'], 'A')
PHIL += q(3, [t('Вставьте пропущенное слово: Она'), u_blank(), t('книгу вчера.')], ['прочитала', 'прочитал', 'прочитали', 'читает', 'прочту'], 'A')
PHIL += q(4, [t('Вставьте пропущенные слова: Лес ___ и река ___ весной.')], ['шумит, разливается', 'шумят, разливаются', 'шумел, разливалась', 'шумит, разливаются', 'шумят, разливается'], 'A')
PHIL += q(5, [t('Закончите предложение: Автор романа «Путь Абая» — ___.')], ['М. Ауэзов', 'С. Муканов', 'Г. Мусрепов', 'И. Есенберлин', 'А. Нурпеисов'], 'A')
PHIL += q(6, [t('Кто автор «Слов назидания»? (настоящие ошибки для контроля)')], ['Абай', 'Абай', 'Шакарим', 'Ч. Валиханов', 'Все перечисленные'], 'A')

NS = ('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
      'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
      'xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" '
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"')

def write(path, paras):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr('word/document.xml', f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {NS}><w:body>{"".join(paras)}</w:body></w:document>')

out = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(out, exist_ok=True)
write(os.path.join(out, 'mechmath.docx'), MECH)
write(os.path.join(out, 'philology.docx'), PHIL)
print('ok')
