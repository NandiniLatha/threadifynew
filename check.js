const https = require('https');

const ids = [
  '1515886657613-9f3515b0c78f',
  '1539109136881-3be0616acf4b',
  '1512436991641-6745cdb1723f',
  '1483985988355-763728e1935b',
  '1550639525-c97d455acf70',
  '1509631179647-0177331693ae',
  '1490481651871-ab68de25d43d',
  '1551488831-00ddcb6c6bd3',
  '1584916201218-f4242ceb4809',
  '1596455607563-ad6193f76b5c', // broken?
  '1598808503746-f34c53b93f3e', // broken?
  '1583391733958-d25e07fac044', // broken?
  '1434389672724-4afa920ce95f',
  '1485230895920-ee9dc1f0f284',
  '1445205170230-053b83016050',
  '1515347619365-b0b2e88a09f3',
  '1469334031218-e382a71b716b',
  '1520975954732-57dd06d6d488',
  '1487222477894-8943e31ef7b2',
  '1512286988463-bd4025d57d59'
];

async function check() {
  for (const id of ids) {
    const url = `https://picsum.photos/seed/photo-${id}/800/600`;
    https.get(url, (res) => {
      console.log(`${id}: ${res.statusCode}`);
    });
  }
}

check();
