import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {review,intervalDays,retrievability} from '../tools/fsrs.mjs';
import {simulate} from '../tools/fsrs-simulate.mjs';

test('FSRS reference reproduces the pinned vectors shared with the Android model',()=>{
  const rows=readFileSync(new URL('./fixtures/fsrs-vectors.csv',import.meta.url),'utf8').trim().split('\n').slice(1).map(l=>l.split(','));
  const bySeq=Map.groupBy(rows,r=>r[0]);
  for(const steps of bySeq.values()){
    let m=null;
    for(const r of steps){
      m=review(m,r[2]==='true',Number(r[3]));
      assert.ok(Math.abs(m.s-Number(r[4]))<1e-12&&Math.abs(m.d-Number(r[5]))<1e-12,r.join());
      assert.equal(intervalDays(m.s),Number(r[6]));
    }
  }
  assert.ok(Math.abs(retrievability(10,10)-0.9)<1e-12);
});
test('the workload simulation is deterministic and keeps retention while FSRS needs fewer reviews',()=>{
  const a=simulate({seed:3}),b=simulate({seed:3});
  assert.deepEqual(a,b);
  assert.equal(a.fixed.words,200);
  assert.ok(a.fsrs.reviews<a.fixed.reviews,JSON.stringify(a));
  assert.ok(a.fsrs.retainedAtEnd>=a.fixed.retainedAtEnd-5,JSON.stringify(a));
});
