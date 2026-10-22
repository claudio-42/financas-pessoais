export type Expense={id:string;name:string;value:number;day:number;category:string;start:string;months:number|null};
export const monthIndex=(month:string)=>{const [y,m]=month.split('-').map(Number);return y*12+m-1;};
export const addMonths=(month:string,n:number)=>{const i=monthIndex(month)+n;return `${Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;};
export const activeIn=(e:Expense,month:string)=>{const offset=monthIndex(month)-monthIndex(e.start);return offset>=0&&(e.months===null||offset<e.months);};
export const fixedTotal=(expenses:Expense[],month:string)=>expenses.filter(e=>activeIn(e,month)).reduce((sum,e)=>sum+Math.round(e.value*100),0)/100;
