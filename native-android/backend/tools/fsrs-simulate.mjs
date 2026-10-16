// Q5.7: compare the review load of today's fixed ladder (1/3/7/14/30 days) with FSRS-5 on the same
// simulated learner. Ground truth memory follows the FSRS forgetting curve with a per-word difficulty
// spread, so this measures workload and retention under that model; it is not a field result.
// Usage: node tools/fsrs-simulate.mjs [--seed 7] [--days 120] [--json]
import {review,retrievability,intervalDays} from './fsrs.mjs';

export function simulate({seed=7,days=120,newPerDay=5,newDays=40}={}){
  const MIN=1/(24*6);// a wrong answer comes back after ten minutes
  const results={};
  for(const policy of ['fixed','fsrs']){
    const r=(s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(seed);
    const words=[];let reviews=0,correct=0,peak=0;const daily=[];
    for(let day=0;day<days;day++){
      if(day<newDays)for(let i=0;i<newPerDay;i++)words.push({hardness:0.6+0.8*r(),truth:null,lastTrue:0,sched:null,lastSched:0,count:0,due:day});
      let today=0;
      for(const pass of [0,1])for(const w of words){
        if(w.due>day+(pass?0.999:0.5))continue;
        const now=day+(pass?0.5:0)+0.01;
        const p=w.truth?retrievability(now-w.lastTrue,w.truth.s):0.5;
        const ok=r()<p;reviews++;today++;if(ok)correct++;
        const next=review(w.truth,ok,now-w.lastTrue);w.truth={s:w.truth?Math.max(0.01,w.truth.s+(next.s-w.truth.s)*w.hardness):next.s*w.hardness,d:next.d};w.lastTrue=now;
        if(policy==='fixed'){
          if(!ok){w.count=0;w.due=now+MIN;}else{w.count=Math.min(100,w.count+1);w.due=Math.floor(now)+[1,3,7,14,30][Math.min(w.count,5)-1];}
        }else{
          w.sched=review(w.sched,ok,now-w.lastSched);w.lastSched=now;
          w.due=ok?Math.floor(now)+intervalDays(w.sched.s):now+MIN;
        }
      }
      daily.push(today);peak=Math.max(peak,today);
    }
    const end=days;
    const retained=words.filter(w=>w.truth&&retrievability(end-w.lastTrue,w.truth.s)>=0.9).length;
    results[policy]={words:words.length,reviews,peakDaily:peak,lastMonthDaily:Math.round(daily.slice(-30).reduce((a,b)=>a+b,0)/30*10)/10,
      successPercent:Math.round(correct/reviews*1000)/10,retainedAtEnd:retained,reviewsPerRetained:Math.round(reviews/Math.max(1,retained)*10)/10};
  }
  return results;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i>0?Number(process.argv[i+1]):fallback;};
  const result=simulate({seed:arg('--seed',7),days:arg('--days',120)});
  if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
  else for(const [policy,m] of Object.entries(result))console.log(policy.padEnd(6),Object.entries(m).map(([k,v])=>`${k}=${v}`).join(' '));
}
