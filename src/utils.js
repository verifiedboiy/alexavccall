export function generateUSNumber() {
  const areaCodes = ['212', '310', '718', '312', '202', '415', '617'];
  const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const mid = Math.floor(Math.random() * 900) + 100;
  const last = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${area}) ${mid}-${last}`;
}

export function formatID(number) {
  return number.replace(/[\s\(\)\-\+]/g, '');
}
