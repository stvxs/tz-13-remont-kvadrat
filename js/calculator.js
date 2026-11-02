const form = document.getElementById('calculator-form');
const repairType = document.getElementById('repair-type');
const repairTypeByPrice = {
  4500: 'cosmetic',
  9000: 'capital',
  14000: 'designer'
};

repairType.addEventListener('change', function() {
  const type = repairTypeByPrice[Number(repairType.value)];
  if (type) trackEvent('repair_type_select', { repair_type: type });
});

form.addEventListener('submit', function(event) {
  event.preventDefault();

  const repairPrice = Number(repairType.value);
  const selectedRepairType = repairTypeByPrice[repairPrice];
  const area = Number(document.getElementById('area').value);
  const bathroom = document.getElementById('bathroom').checked;
  const demolition = document.getElementById('demolition').checked;
  const result = document.getElementById('result');

  if (!Number.isFinite(area) || area < 10 || area > 300) {
    result.innerHTML = '<h2>Введите площадь от 10 до 300 м²</h2>';
    return;
  }
  if (!selectedRepairType) {
    result.innerHTML = '<h2>Выберите тип ремонта</h2>';
    return;
  }

  let cost = repairPrice * area;
  if (demolition) cost += 700 * area;
  if (bathroom) cost += 180000;

  let daysPerMeter = 0.6;
  if (repairPrice === 9000) daysPerMeter = 1.2;
  else if (repairPrice === 14000) daysPerMeter = 1.8;

  let days = Math.ceil(area * daysPerMeter);
  if (bathroom) days += 10;

  const materials = Math.round(cost * 0.35);
  result.innerHTML = `
    <h2>Результат расчёта</h2>
    <p>Стоимость работ: <strong>${cost.toLocaleString('ru-RU')} ₽</strong></p>
    <p>Черновые материалы (ориентировочно, 35% от стоимости работ): ${materials.toLocaleString('ru-RU')} ₽</p>
    <p>Предварительный срок: <strong>${days} дней</strong></p>
    <p>Расчёт ориентировочный. Точная смета — после выезда инженера, бесплатно.</p>
    <a class="button" id="order-with-calculation" href="#" style="color: #fff;">Заказать выезд с этим расчётом</a>
  `;

  const orderUrl = new URL('contacts.html', window.location.href);
  orderUrl.searchParams.set('repair_type', selectedRepairType);
  orderUrl.searchParams.set('area_m2', String(area));
  orderUrl.hash = 'lead-form';
  document.getElementById('order-with-calculation').href = orderUrl.href;

  trackEvent('repair_calc', {
    repair_type: selectedRepairType,
    area_m2: area,
    total_price: cost,
    days: days
  });
});
