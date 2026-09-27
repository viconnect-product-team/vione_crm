import fs from 'node:fs';
import path from 'node:path';

const localesDir = path.resolve('..', '..', 'packages/shared/locales');
const files = ['vi.json', 'en.json', 'lo.json', 'km.json', 'my.json'];

const translations = {
  'common.deleted': {
    vi: 'Đã xóa',
    en: 'Deleted',
    lo: 'ລຶບແລ້ວ',
    km: 'បានលុប',
    my: 'ဖျက်ပြီးပါပြီ',
  },
  'common.required': {
    vi: 'Bắt buộc',
    en: 'Required',
    lo: 'ຈໍາເປັນ',
    km: 'ទាមទារ',
    my: 'လိုအပ်သည်',
  },
  'meet.attendeesCount': {
    vi: 'Số người tham dự',
    en: 'Attendees count',
    lo: 'ຈໍານວນຜູ້ເຂົ້າຮ່ວມ',
    km: 'ចំនួនអ្នកចូលរួម',
    my: 'တက်ရောက်သူဦးရေ',
  },
  'meet.deleteConfirm': {
    vi: 'Bạn có chắc chắn muốn xóa cuộc họp này không?',
    en: 'Are you sure you want to delete this meeting?',
    lo: 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບການປະຊຸມນີ້?',
    km: 'តើអ្នកប្រាកដជាចង់លុបការប្រជុំនេះទេ?',
    my: 'ဤအစည်းအဝေးကို ဖျက်ရန် သေချာပါသလား။',
  },
  'meet.edit': {
    vi: 'Chỉnh sửa cuộc họp',
    en: 'Edit meeting',
    lo: 'ແກ້ໄຂການປະຊຸມ',
    km: 'កែសម្រួលការប្រជុំ',
    my: 'အစည်းအဝေးကို တည်းဖြတ်ပါ',
  },
  'meet.fields.date': {
    vi: 'Ngày họp',
    en: 'Date',
    lo: 'ວັນທີ',
    km: 'កាលបរិច្ឆេទ',
    my: 'ရက်စွဲ',
  },
  'meet.fields.location': {
    vi: 'Địa điểm',
    en: 'Location',
    lo: 'ສະຖານທີ່',
    km: 'ទីតាំង',
    my: 'တည်နေရာ',
  },
  'meet.fields.status': {
    vi: 'Trạng thái',
    en: 'Status',
    lo: 'ສະຖານະ',
    km: 'ស្ថានភាព',
    my: 'အခြေအနေ',
  },
  'meet.fields.time': {
    vi: 'Thời gian',
    en: 'Time',
    lo: 'ເວລາ',
    km: 'ពេលវេលា',
    my: 'အချိန်',
  },
  'meet.fields.title': {
    vi: 'Tiêu đề cuộc họp',
    en: 'Meeting title',
    lo: 'ຫົວຂໍ້ການປະຊຸມ',
    km: 'ចំណងជើងការប្រជុំ',
    my: 'အစည်းအဝေးခေါင်းစဉ်',
  },
  'meet.fields.type': {
    vi: 'Hình thức',
    en: 'Type',
    lo: 'ຮູບແບບ',
    km: 'ប្រភេទ',
    my: 'အမျိုးအစား',
  },
};

for (const file of files) {
  const filePath = path.join(localesDir, file);
  if (!fs.existsSync(filePath)) continue;
  const lang = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const [key, map] of Object.entries(translations)) {
    data[key] = map[lang] || map.en || map.vi;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${file}`);
}
