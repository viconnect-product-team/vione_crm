async function main() {
  try {
    const res = await fetch('http://14.225.217.232:5003/api/products');
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Data:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
main();
