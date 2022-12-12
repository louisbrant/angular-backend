export function swapObjectValues(obj:object, noSwap: boolean): object  {
    return noSwap ? {
      [Object.keys(obj)[0]] : Object.values(obj)[0],
      [Object.keys(obj)[1]] : Object.values(obj)[1]
    } : {
      [Object.keys(obj)[0]] : Object.values(obj)[1],
      [Object.keys(obj)[1]] : Object.values(obj)[0]
    };
}

export function fixNull(num: number | null ): number{
    return num === null ? 0 : num;  
  }

export function  countPercentage(a: number | null, b: number | null): number{
    if( a === 0 || b === 0){
      return 0;
    }

    if( a === null || b === null){
      return 0;
    }
       return +((a / b) * 100).toFixed(); 
  }

export function  divideNumbers(a: number, b: number){
    if( a === null || b === null){
      return 0;
    }

    if( a === 0 || b === 0){
      return 0;
    }
    
    return +(a / b).toFixed(2);
  }

  