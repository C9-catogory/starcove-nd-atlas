import { readJson, writeJson, inferTags } from './content-lib.mjs';

const rules = await readJson('tag-rules.json');
for (const file of ['research.json','research-inbox.json']) {
  const records = await readJson(file);
  for (const record of records) record.autoTags = inferTags(record, rules);
  await writeJson(file, records);
  console.log(`${file}: 已更新 ${records.length} 条自动标签。`);
}
