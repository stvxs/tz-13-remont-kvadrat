
const form = document.getElementById('calculator-form');

form.addEventListener('submit', function(event) {
  event.preventDefault();

  const repairPrice = Number(
    document.getElementById('repair-type').value
  );

  const area = Number(
    document.getElementById('area').value
  );

  const bathroom = document.getElementById('bathroom').checked;
  const demolition = document.getElementById('demolition').checked;

  if (!Number.isFinite(area) || area < 1 || area > 500) {
    document.getElementById('result').innerHTML =
      '<h2>Введите площадь от 1 до 500 м²</h2>';
    return;
  }

  let cost = repairPrice * area;

  if (demolition) {
    cost += 700 * area;
  }

  if (bathroom) {
    cost += 180000;
  }

  let daysPerMeter = 0.6;

  if (repairPrice === 9000) {
    daysPerMeter = 1.2;
  } else if (repairPrice === 14000) {
    daysPerMeter = 1.8;
  }

  let days = Math.ceil(area * daysPerMeter);

  if (bathroom) {
    days += 10;
  }

    const materials = Math.round(cost * 0.35);

  document.getElementById('result').innerHTML = `
    <h2>Результат расчёта</h2>
    <p>Стоимость работ: <strong>${cost.toLocaleString('ru-RU')} ₽</strong></p>
    <p>Ориентировочная стоимость материалов: ${materials.toLocaleString('ru-RU')} ₽</p>
    <p>Предварительный срок: <strong>${days} дней</strong></p>
    <p>Расчёт является предварительным и уточняется после осмотра объекта.</p>
  `;

  trackEvent('calculate_repair', {
    repair_price: repairPrice,
    area: area,
    bathroom: bathroom,
    demolition: demolition,
    estimated_cost: cost,
    estimated_days: days
  });
});
