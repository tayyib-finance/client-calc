/* ================= НАСТРОЙКИ ================= */
var SELLER_PHONE = '79887836677';
var SHOPS = {
  '1': {rate:0.05, freeMonths:0},
  '2': {rate:0.037, freeMonths:0},
  '3': {rate:0.05, freeMonths:3},
  '4': {rate:0.037, freeMonths:3}
};
var DEFAULT_RATE = 0.05;
var DEFAULT_FREE = 0;
var MAX_PRICE = 10000000;
var MIN_PRICE = 1000;

var urlParams = new URLSearchParams(window.location.search);
var shopCode = urlParams.get('m') || 'default';
var SHOP = SHOPS[shopCode] || {rate:DEFAULT_RATE, freeMonths:DEFAULT_FREE};
var RATE = SHOP.rate;
var FREE_MONTHS = SHOP.freeMonths;

/* ================= УТИЛИТЫ ================= */
function fmt(n){ return Math.round(n).toLocaleString('ru-RU'); }
function fmtR(n){ return fmt(n) + ' р.'; }
function toast(msg){
  var t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(window._tt);
  window._tt = setTimeout(function(){ t.classList.remove('show'); }, 2000);
}

function numToWords(n){
  n = Math.round(n);
  if(n === 0) return 'ноль';
  var ones = ['','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
  var tens = ['','','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
  var hunds = ['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'];
  function chunk(num){
    var r = [];
    if(num >= 100){ r.push(hunds[Math.floor(num/100)]); num = num % 100; }
    if(num >= 20){ r.push(tens[Math.floor(num/10)]); num = num % 10; if(num > 0) r.push(ones[num]); }
    else if(num > 0){ r.push(ones[num]); }
    return r.join(' ');
  }
  function decl(num, forms){
    var n100 = num % 100, n10 = num % 10;
    if(n100 >= 11 && n100 <= 19) return forms[2];
    if(n10 === 1) return forms[0];
    if(n10 >= 2 && n10 <= 4) return forms[1];
    return forms[2];
  }
  var parts = [];
  var m = Math.floor(n / 1000000), t = Math.floor((n % 1000000) / 1000), u = n % 1000;
  if(m > 0) parts.push(chunk(m) + ' ' + decl(m, ['миллион','миллиона','миллионов']));
  if(t > 0) parts.push(chunk(t) + ' ' + decl(t, ['тысяча','тысячи','тысяч']));
  if(u > 0) parts.push(chunk(u));
  return parts.join(' ');
}

function formatPhone(input){
  var v = input.value.replace(/\D/g,'');
  if(v.indexOf('7') === 0 || v.indexOf('8') === 0) v = v.slice(1);
  v = v.slice(0,10);
  var out = '+7';
  if(v.length > 0) out += ' (' + v.slice(0,3);
  if(v.length >= 3) out += ')';
  if(v.length > 3) out += ' ' + v.slice(3,6);
  if(v.length > 6) out += '-' + v.slice(6,8);
  if(v.length > 8) out += '-' + v.slice(8,10);
  input.value = out;
}

/* ================= РАСЧЁТ ================= */
function calcMurabaha(price, down, months){
  var fin = price - down;
  var paidMonths = Math.max(0, months - FREE_MONTHS);
  var markup = fin * RATE * paidMonths;
  var total = price + markup;
  var monthly = Math.round((fin + markup) / months);
  return {fin:fin, markup:markup, total:total, monthly:monthly};
}

function syncFromRange(which){
  var priceEl = document.getElementById('c-price');
  var downEl = document.getElementById('c-down');
  var monthsEl = document.getElementById('c-months');
  if(!priceEl) return;
  if(which === 'price'){
    downEl.max = +priceEl.value;
    if(+downEl.value < +priceEl.value * 0.2) downEl.value = Math.round(+priceEl.value * 0.2);
  }
  var price = +priceEl.value, down = Math.min(+downEl.value, price), months = +monthsEl.value;
  document.getElementById('c-price-v').value = fmtR(price);
  document.getElementById('c-down-v').value = fmtR(down);
  document.getElementById('c-months-v').value = months;
  var c = calcMurabaha(price, down, months);
  document.getElementById('c-monthly').textContent = fmtR(c.monthly);
  document.getElementById('c-markup').textContent = fmtR(c.markup);
  document.getElementById('c-total').textContent = fmtR(c.total);
}

function editNum(which){
  var map = {price:'c-price-v', down:'c-down-v', months:'c-months-v'};
  var el = document.getElementById(map[which]);
  el.value = el.value.replace(/\D/g,'');
  el.select();
}

function applyNum(which){
  var mapR = {price:'c-price', down:'c-down', months:'c-months'};
  var mapV = {price:'c-price-v', down:'c-down-v', months:'c-months-v'};
  var rangeEl = document.getElementById(mapR[which]);
  var val = parseInt(document.getElementById(mapV[which]).value.replace(/\D/g,'')) || 0;
  if(which === 'months') val = Math.max(1, Math.min(24, val));
  if(which === 'price') val = Math.max(MIN_PRICE, Math.min(MAX_PRICE, val));
  if(which === 'down'){
    var p = +document.getElementById('c-price').value;
    val = Math.max(Math.round(p * 0.2), Math.min(p, val));
  }
  rangeEl.value = val;
  syncFromRange(which === 'down' ? 'price' : which);
  if(which === 'down') syncFromRange('price');
}

function renderPromo(){
  var el = document.getElementById('promoBlock');
  if(!el) return;
  if(FREE_MONTHS > 0){
    el.innerHTML = '<div class="promo-badge"><div class="gift">🎁</div><div>Первые ' + FREE_MONTHS + ' месяца без наценки — вы платите только стоимость товара</div></div>';
  } else {
    el.innerHTML = '';
  }
}

function closeModal(){
  var m = document.getElementById('modalBg');
  if(m) m.classList.remove('active');
}

/* ================= АНКЕТА (С МАГАЗИНОМ) ================= */
function openAnketa(){
  var price = +document.getElementById('c-price').value;
  var down = +document.getElementById('c-down').value;
  var months = +document.getElementById('c-months').value;
  var c = calcMurabaha(price, down, months);
  window._anketaData = {price:price, down:down, months:months, markup:c.markup, total:c.total, monthly:c.monthly};

  var promoRow = FREE_MONTHS > 0 ? '<div class="row"><span class="k">Бесплатных месяцев</span><span class="v" style="color:#c8dd5f">'+FREE_MONTHS+' 🎁</span></div>' : '';

  document.getElementById('modalTitle').textContent = 'Анкета клиента';
  document.getElementById('modalBody').innerHTML =
    '<div class="field"><label>ФИО *</label><input id="a-name" placeholder="Фамилия Имя Отчество"></div>'+
    '<div class="field"><label>Телефон *</label><input id="a-phone" type="tel" value="+7 " onfocus="if(this.value===\'+7 \')this.setSelectionRange(3,3)" oninput="formatPhone(this)" placeholder="+7 (___) ___-__-__"></div>'+
    '<div class="field"><label>Товар / услуга *</label><input id="a-product" placeholder="Например: диван"></div>'+
    '<div class="field"><label>Место покупки (магазин)</label><input id="a-shop" placeholder="Например: DNS, Мебель-Дагестан"></div>'+
    
    '<div class="anketa-preview">'+
      '<div style="font-weight:700;margin-bottom:8px;color:#fff">Ваша рассрочка:</div>'+
      '<div class="row"><span class="k">Стоимость товара</span><span class="v">'+fmtR(price)+'</span></div>'+
      '<div class="row"><span class="k">Вы вносите сейчас</span><span class="v">'+fmtR(down)+'</span></div>'+promoRow+
      '<div class="row"><span class="k">Платёж в месяц</span><span class="v" style="font-size:18px;">'+fmtR(c.monthly)+'</span></div>'+
      '<div class="row"><span class="k">Общая переплата</span><span class="v" style="opacity:0.8">'+fmtR(c.markup)+'</span></div>'+
      '<div class="row"><span class="k">Итого к оплате</span><span class="v">'+fmtR(c.total)+'</span></div>'+
    '</div>'+

    '<button class="btn btn-dark" onclick="showContractForm()" style="margin-bottom:10px">📄 Перейти к заполнению паспорта</button>'+
    '<button class="btn btn-wa" onclick="sendToWhatsApp()">📲 Отправить заявку в WhatsApp</button>';

  document.getElementById('modalBg').classList.add('active');
}

/* ================= ДАННЫЕ ПАСПОРТА ================= */
function showContractForm(){
  var name = document.getElementById('a-name').value.trim();
  var phone = document.getElementById('a-phone').value.trim();
  var product = document.getElementById('a-product').value.trim();
  var shop = document.getElementById('a-shop').value.trim();
  
  if(!name || !phone || !product){ toast('Заполните ФИО, телефон и товар в анкете'); return; }

  document.getElementById('modalTitle').textContent = 'Паспортные данные';
  document.getElementById('modalBody').innerHTML =
    '<div style="color:var(--muted);font-size:13px;margin-bottom:14px;line-height:1.5">Заполните данные точно как в паспорте.</div>'+
    
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'+
      '<div class="field"><label>Серия *</label><input id="p-seria" placeholder="82 03" maxlength="5"></div>'+
      '<div class="field"><label>Номер *</label><input id="p-number" placeholder="609108" maxlength="6"></div>'+
    '</div>'+
    
    '<div class="field"><label>Дата выдачи *</label><input id="p-date" type="date"></div>'+
    '<div class="field"><label>Кем выдан *</label><input id="p-issued" placeholder="УФМС России по Респ. Дагестан..."></div>'+
    '<div class="field"><label>Код подразделения</label><input id="p-code" placeholder="050-001" maxlength="7"></div>'+
    '<div class="field"><label>Место регистрации</label><input id="p-reg" placeholder="с. Хасавюрт, ул. Ленина 12"></div>'+
    
    '<hr style="border:none;border-top:1px solid var(--line);margin:16px 0;">'+
    
    '<div class="field"><label>ФИО Продавца</label><input id="d-seller" value="Газиев Руслан Магомедович"></div>'+
    '<div class="field"><label>Свидетель (ФИО)</label><input id="d-witness" placeholder="Необязательно"></div>'+
    '<div class="field"><label>Email для скана</label><input id="d-email" value="summa050505@gmail.com"></div>'+
    '<div class="field"><label>Город</label><input id="d-city" value="Хасавюрт"></div>'+
    
    '<button class="btn btn-dark" onclick="printContract(\''+name.replace(/'/g,"\\'")+'\',\''+phone.replace(/'/g,"\\'")+'\',\''+product.replace(/'/g,"\\'")+'\',\''+shop.replace(/'/g,"\\'")+'\')" style="margin-bottom:10px">🖨 Сформировать и распечатать</button>'+
    '<button class="btn btn-outline" onclick="openAnketa()">← Назад к анкете</button>';
}

/* ================= ПЕЧАТЬ ДОГОВОРА ================= */
function printContract(name, phone, product, shop){
  var d = window._anketaData;
  var ser = document.getElementById('p-seria').value.trim();
  var num = document.getElementById('p-number').value.trim();
  var pDate = document.getElementById('p-date').value;
  var issued = document.getElementById('p-issued').value.trim();
  var pCode = document.getElementById('p-code').value.trim();
  var pReg = document.getElementById('p-reg').value.trim();
  
  var seller = document.getElementById('d-seller').value || 'Газиев Руслан Магомедович';
  var witness = document.getElementById('d-witness').value.trim();
  var email = document.getElementById('d-email').value || 'summa050505@gmail.com';
  var city = document.getElementById('d-city').value || 'Хасавюрт';
  
  var today = new Date();
  var monthsList = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  var todayFmt = today.getDate() + ' ' + monthsList[today.getMonth()] + ' ' + today.getFullYear() + ' г.';
  
  var endDate = new Date(today.getFullYear(), today.getMonth() + d.months, today.getDate());
  var endFmt = endDate.getDate() + ' ' + monthsList[endDate.getMonth()] + ' ' + endDate.getFullYear() + ' г.';

  var passportStr = '';
  if(ser || num) passportStr += 'паспорт серия ' + ser + ' номер ' + num;
  if(pDate) {
    var pd = new Date(pDate);
    passportStr += ', выдан ' + pd.getDate() + '.' + (pd.getMonth()+1) + '.' + pd.getFullYear();
  }
  if(issued) passportStr += ' ' + issued;
  if(pCode) passportStr += ', код подразделения ' + pCode;
  if(passportStr) passportStr = ', ' + passportStr;

  var regStr = pReg ? ', зарегистрирован по адресу: ' + pReg : '';
  var shopStr = shop ? ', приобретённый в магазине "' + shop + '"' : '';

  var html = '<h1>ДОГОВОР от ' + todayFmt + '</h1>'+
  '<div class="sub">С именем Аллаха Милостивого и Милосердного.</div>'+
  '<ol>'+
  '<li>Я, <b>' + seller + '</b>' + (witness ? ' (свидетель <b>' + witness + '</b>)' : '') + ' отдаю в рассрочку <b>' + name + '</b>' + passportStr + regStr + ' товар: <b>' + product + '</b>' + shopStr + ' на сумму <b>' + fmt(d.total) + ' (' + numToWords(d.total) + ') рублей</b> на срок <b>' + d.months + ' месяцев</b>.</li>'+
  '<li>Сумма ежемесячного платежа в течении ' + d.months + ' месяцев составляет <b>' + fmt(d.monthly) + ' (' + numToWords(d.monthly) + ') рублей</b>.</li>'+
  '<li>Окончательный день оплаты <b>' + endFmt + '</b>.</li>'+
  '<li>В случае резкого удешевления рубля (девальвация) в период действия договора, будем рассматривать этот вопрос в Шариатском суде.</li>'+
  '<li>Настоящий Договор вступает в силу с момента его подписания Сторонами.</li>'+
  '<li>Покупатель обязуется в течение 24 (двадцати четырех) часов с момента получения настоящего Договора в электронном виде распечатать, лично подписать, поставить дату и направить скан-копию подписанного Договора на адрес электронной почты: <b>' + email + '</b>.</li>'+
  '<li>Покупателю строго запрещается использовать Товар для получения наличных денежных средств (обналичивания).</li>'+
  '<li>В случае выявления факта использования Товара в целях обналичивания, Покупатель несет полную ответственность перед Всевышним Аллахом, влекущую утрату Барака (Божественной благодати) в сделке.</li>'+
  '<li>Если Покупатель по разным причинам не имеет возможности осуществить платеж в срок, он обязуется не позднее 3 (трех) рабочих дней до наступления даты платежа, письменно или по телефону уведомить об этом Продавца 8 (988) 783-66-77.</li>'+
  '<li>Настоящий Договор заключен в соответствии с нормами Исламского права (Шариата), что делает его дозволенным (халяль).</li>'+
  '<li>Стороны осознают, что неисполнение условий Договора (нарушение сроков оплаты, предоставление ложных сведений, использование Товара в запрещенных целях) влечет за собой ответственность в первую очередь перед Всевышним, также влечет применение мер предусмотренных исламским правом!</li>'+
  '<li>Как пришло в Хадисе: «У нечестного нет веры, у не исполняющего обещаний нет религии». Нарушение Договора является признаком вероломства и лицемерия, за что человек понесет ответственность в Судный День.</li>'+
  '</ol>'+
  '<p style="margin-top:20px"><b>Подписи сторон:</b></p>'+
  '<div class="signs">'+
    '<div class="sign-col"><p>Продавец: ' + seller + '</p><div class="sign-line"></div><div class="sign-label">(подпись)</div></div>'+
    '<div class="sign-col"><p>Покупатель: ' + name + '</p><div class="sign-line"></div><div class="sign-label">(подпись)</div></div>'+
  '</div>'+
  '<div class="footer">Город: ' + city + ' · Дата: ' + todayFmt + '</div>';

  document.getElementById('printArea').innerHTML = html;
  window.print();
}

/* ================= WHATSAPP ================= */
function buildMessage(){
  var name = document.getElementById('a-name').value.trim();
  var phone = document.getElementById('a-phone').value.trim();
  var product = document.getElementById('a-product').value.trim();
  var shop = document.getElementById('a-shop') ? document.getElementById('a-shop').value.trim() : '';
  var d = window._anketaData;

  var promoLine = FREE_MONTHS > 0 ? '🎁 *Акция:* первые ' + FREE_MONTHS + ' мес. без наценки\n' : '';
  var shopLine = shop ? '🏪 *Магазин:* ' + shop + '\n' : '';

  return 'Ассаляму алейкум! Хочу оформить рассрочку.\n\n'+
    '📦 *Товар:* ' + product + '\n' +
    shopLine +
    '\n💰 *Параметры:*\n'+
    '• Стоимость: ' + fmtR(d.price) + '\n'+
    '• Первый взнос: ' + fmtR(d.down) + '\n'+
    '• Срок: ' + d.months + ' мес.\n'+
    promoLine +
    '• Платёж в месяц: ' + fmtR(d.monthly) + '\n'+
    '• Итого: ' + fmtR(d.total) + '\n'+
    '\n👤 *Мои данные:*\n'+
    '• ФИО: ' + name + '\n'+
    '• Телефон: ' + phone + '\n'+
    '\nПрошу связаться для оформления.';
}

function sendToWhatsApp(){
  var name = document.getElementById('a-name').value.trim();
  var phone = document.getElementById('a-phone').value.trim();
  var product = document.getElementById('a-product').value.trim();

  if(!name){ toast('Введите ФИО'); return; }
  if(phone.length < 18){ toast('Введите телефон полностью'); return; }
  if(!product){ toast('Укажите товар'); return; }

  var text = buildMessage();
  var url = 'https://wa.me/' + SELLER_PHONE + '?text=' + encodeURIComponent(text);
  window.open(url, '_blank');
}

/* ================= СТАРТ ================= */
document.addEventListener('DOMContentLoaded', function(){
  renderPromo();
  syncFromRange('price');
});
