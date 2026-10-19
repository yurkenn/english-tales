// Q4.3c: study-word proposals for editor review.
//   node tools/study-words.mjs write  -> writes content/study-words/proposals.json
//   node tools/study-words.mjs check  -> fails when the proposals file is stale
//   node tools/study-words.mjs report -> prints one line per story
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {proposeStudyWords} from './study-words-lib.mjs';

const catalogUrl=new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url);
const glossaryUrl=new URL('../content/glossary/tr.json',import.meta.url);
const output=new URL('../content/study-words/proposals.json',import.meta.url);
const serialize=value=>JSON.stringify(value,null,1)+'\n';

const proposals=proposeStudyWords(JSON.parse(await readFile(catalogUrl,'utf8')),JSON.parse(await readFile(glossaryUrl,'utf8')));
const command=process.argv[2];
if(command==='write'){await mkdir(new URL('.',output),{recursive:true});await writeFile(output,serialize(proposals));console.log(`${proposals.stories.length} stories written`);}
else if(command==='check'){if(await readFile(output,'utf8').catch(()=>'')!==serialize(proposals)){console.error('Study-word proposals are stale: run npm run study-words:write');process.exit(1);}console.log('Study-word proposals are current');}
else if(command==='report')for(const s of proposals.stories)console.log(`${s.level}\t${s.storyId}\tout-of-level ${s.outOfLevelPercent}%\t${s.proposed.map(p=>`${p.lemma}${p.aboveLevel?'*':''}=${p.translation}`).join(', ')}`);
else{console.error('usage: node tools/study-words.mjs write|check|report');process.exit(2);}
