import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildPilotPreview} from './story-pilot-preview-lib.mjs';

export async function main(args=process.argv.slice(2)){
  let output=fileURLToPath(new URL('../../build/story-pilot-preview/',import.meta.url)),fixtureOutput,requireReviewed=false;
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(arg==='--require-reviewed')requireReviewed=true;
    else if(arg==='--output'||arg==='--fixture-output'){
      const value=args[++i];if(!value||value.startsWith('--'))throw Error(`Missing value: ${arg}`);
      if(arg==='--output')output=path.resolve(value);else fixtureOutput=path.resolve(value);
    }else if(arg==='--help'){
      console.log('node tools/story-pilot-preview.mjs [--output <directory>] [--fixture-output <test-asset.json>] [--require-reviewed]\nOffline previews only; never publishes or assigns review approval.');return;
    }else throw Error(`Unknown option: ${arg}`);
  }
  const productionAssets=await realpath(fileURLToPath(new URL('../../app/src/main/',import.meta.url)));
  const physical=async target=>{
    let parent=path.resolve(target);const suffix=[];
    for(;;){
      try{return path.join(await realpath(parent),...suffix);}
      catch(error){if(error.code!=='ENOENT')throw error;const up=path.dirname(parent);if(up===parent)throw error;suffix.unshift(path.basename(parent));parent=up;}
    }
  };
  const isProduction=async target=>{const relative=path.relative(productionAssets,await physical(target));return relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative));};
  if(await isProduction(output)||(fixtureOutput&&await isProduction(fixtureOutput)))throw Error('Unreviewed previews cannot be written into production app sources');
  const read=async url=>JSON.parse(await readFile(url,'utf8'));
  const catalog=await read(new URL('../../app/src/main/assets/catalog/v1.json',import.meta.url));
  const scope=await read(new URL('../content/drafts/pilot-scope.json',import.meta.url));
  // Validate IDs before using them as local paths.
  if(!Array.isArray(scope.activeRevisionStoryIds)||!scope.activeRevisionStoryIds.every(id=>typeof id==='string'&&/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)))throw Error('Invalid active story IDs');
  const drafts=await Promise.all(scope.activeRevisionStoryIds.map(id=>read(new URL(`../content/drafts/revisions/${id}.json`,import.meta.url))));
  const packet=buildPilotPreview(catalog,scope,drafts,{requireReviewed});
  // All validation/review gates run before the first output write.
  const json=value=>JSON.stringify(value,null,2)+'\n';
  await mkdir(output,{recursive:true});
  for(const story of packet.stories)await writeFile(path.join(output,`${story.storyId}.json`),json(story.preview));
  await writeFile(path.join(output,'manifest.json'),json(packet));
  if(fixtureOutput){await mkdir(path.dirname(fixtureOutput),{recursive:true});await writeFile(fixtureOutput,json(packet.stories[0].preview));}
  console.log(JSON.stringify({output,stories:packet.stories.length,status:packet.status,humanReviewComplete:packet.stories.every(s=>s.review.complete)},null,2));
  return packet;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
