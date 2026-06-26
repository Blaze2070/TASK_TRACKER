describe('CsvService', () => {
  it('should format header and rows with semicolon', () => {
    const records = [
      { ID: '1', Название: 'Тест', Статус: 'PENDING', Приоритет: 'HIGH', Прогресс: '50%' },
    ];
    const { stringify } = require('csv-stringify/sync');
    const csv = stringify(records, { header: true, delimiter: ';' });
    expect(csv).toContain('Тест');
    expect(csv).toContain('HIGH');
    expect(csv).toContain('50%');
  });
});
