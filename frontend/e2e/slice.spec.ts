import {test,expect} from '@playwright/test';
test('actual C Wasm worker inserts into an array',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Initialize C array'}).click();
 await expect(page.getByTestId('engine-state')).toContainText('ready');
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Step',exact:true}).click();
 await expect(page.getByTestId('engine-state')).toContainText('"data":[3,9,1,4]');
});
