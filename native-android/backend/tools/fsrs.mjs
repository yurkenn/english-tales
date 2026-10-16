// Q5.7: FSRS-5 (Free Spaced Repetition Scheduler) reference used by the simulation and parity vectors.
// The app answers are binary, so a correct answer is grade 3 (Good) and a wrong one grade 1 (Again).
// Kotlin `Fsrs` must produce the same numbers; tests/fixtures/fsrs-vectors.csv pins both.
export const W=[0.40255,1.18385,3.173,15.69105,7.1949,0.5345,1.4604,0.0046,1.54575,0.1192,1.01925,1.9395,0.11,0.29605,2.2698,0.2315,2.9898,0.51655,0.6621];
const DECAY=-0.5,FACTOR=19/81;
const clampD=d=>Math.min(10,Math.max(1,d));
const initS=g=>W[g-1];
const initD=g=>clampD(W[4]-Math.exp(W[5]*(g-1))+1);
export const retrievability=(elapsedDays,s)=>Math.pow(1+FACTOR*elapsedDays/s,DECAY);
const nextD=(d,g)=>{const dp=d-W[6]*(g-3)*(10-d)/9;return clampD(W[7]*initD(4)+(1-W[7])*dp);};
const recallS=(d,s,r)=>s*(Math.exp(W[8])*(11-d)*Math.pow(s,-W[9])*(Math.exp(W[10]*(1-r))-1)+1);
const forgetS=(d,s,r)=>Math.min(W[11]*Math.pow(d,-W[12])*(Math.pow(s+1,W[13])-1)*Math.exp(W[14]*(1-r)),s);
const shortTermS=(s,g)=>s*Math.exp(W[17]*(g-3+W[18]));
/** Interval in whole days for 90% retention (for FSRS-5 that is the stability itself), 1..36500. */
export const intervalDays=s=>Math.min(36500,Math.max(1,Math.round(s)));
/** state: null for a new card or {s,d}; elapsedDays since the last review. */
export function review(state,correct,elapsedDays){
  const g=correct?3:1;
  if(!state)return {s:initS(g),d:initD(g)};
  if(elapsedDays<1)return {s:shortTermS(state.s,g),d:nextD(state.d,g)};
  const r=retrievability(elapsedDays,state.s);
  return {s:correct?recallS(state.d,state.s,r):forgetS(state.d,state.s,r),d:nextD(state.d,g)};
}
