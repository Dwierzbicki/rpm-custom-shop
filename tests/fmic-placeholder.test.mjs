import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import ts from 'typescript';
const source=readFileSync(new URL('../app/lib/fmic-placeholder.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {isMagentoPlaceholder}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
// 96x96 grayscale sample of the actual Magento placeholder, cropped from reported screenshot.
const sample=inflateSync(Buffer.from('eNrtmctywyAMRf//ZyvES6irAg4pDzcBbKadDlplkRzLQleOrz4/14bbsaMKXgUmR9bTeRneSKGIF/HZohACpKE12WsEECGkXVCimPwR4It0a+bMpEQRqOne0og6lL3tnA0KaPiA5paWdFad0NMVOH7lSmhPR3EeIIkd0SVBgW/KLP/iVlCgl9uF6qjmVL2CqyLZ6SnWdI2kR8HyC8QizQhKVoWPDeOvQNUteDFcLw2ITFFey1heekwMoTRQdUo+c5h03bNqZCbVhyiEqfvcyub+ehLnmBx+Fz6ewcnMZzZpnI4JOvyuOj7j6dTw+aR76f0zRIqqa/RjTpw9LdXpxBjpGvX6B7VEXsuN9Uk+PDa6kV7xYaglKFU057tevvwxEypnpsn7rZPfHBU7mzrHVgMnl1svX7fPd0x87WcFt203wjfZsXJof4WgngrxtSs14T/hEL+YJuyCVkFm/KjponpyMP9SFZB1RuDjIbzsmKf5lERR5n/8j/u+zVm+ebZewwfQl/P3nZfmXc3H+GC5yM/E2eQfcGbzN3/zN3/zN3/zN3/zf5OfXnRm+fjy/cvZ9J4zn7/ssvKm+frdC+fh0o7zMTgVPS5KfIev0+rKPxoV7/jBkZQfM/XRrtus1IP5+7z1iAvHbpA/uNUY5c+buN31//t8jC4cFS4R6It807icyeN6OH9XlzqFZSYps4dR3LEC4OChF27lgF3Y6+aKZsUAYdbctfhikjX/lu1IMbjhYTkc3gzdvQELJhA+jZkFK0K2R5EAFy0Ij9UFqFV0R0xamssbqQ7TdlWw27HjP8UXEPKW8A==','base64'));
const yarisSample=inflateSync(Buffer.from('eNrtmdGO4yAMRf//a43B4Hie1jTNBkiaAgkjrRZXGlVq52CMbZrrZZk27W0yegEe7b93YaD3wRqDfhjeARg164ccBKHZzPHDC4gEZ3YDpAdPmpXlTWH2yXP2aI5Gy4/cTvfoe0AwZ2b9EwXF7gNe9+SCiPAtukc4x29BklsF5Qy8XubTFtBLb9cQdjkONORM+WqgQercg8cibdBHT8vjhr4gaa8Bg3sg1qqNCzDh/slrAXx1DGlYRcOQOwkYksDZ8iRc2xaOBaUNQbIvFGeuHaN6hXCgO75qd+sGazpGjOJCFtLgqm8nGSIxu8AkyQTRC64512NsT/BLrL1juX2zeENl//a+EOX0LvbmECS5vkPKY/OXWSe+3C24q6zEY9Z8O7HDCuE6Oq13iJSbruSD8RcXGn9OiSo+oHYDybud31LHl4fIablV8e0h8B7sxqd3NXP626WNnxa76CtYBNry0sd2sOQ3l7gWPnJSU/qOQM1tfIp1a7P4ydLKT6oorA3DJf6Xxcq9fG359m+fyPnal5I99PpPSR8q+Bqy/Qg6+UkvLfmvYvc3+VkfLfyPW6DJn/zJn/zJn/zJn/zJ/5f5+mw7lm8gVCgP/fFBupY648Om/mTu4q+K31eVOQpGff5j+Kox8artdPABa3VvDVIrX5/vXLWMmD55VvNZfloE7eb4dI5nWvjLf8jHQszmRI7BKsWtXu6Dl4LrNs1Qe839EYAsmZJLhDveEMsTgx4ycDIgwadGMLJq3YVOiM8NeLgIUnQ+doMnp5GrAIbvP3bAoHNXvZFGDAiFCTbFeNAgOOY+DhzQCnsaPGIePsOeNu0X7Q9qQpPv','base64'));
test('recognizes Yaris Magento placeholder from second screenshot',()=>assert.equal(isMagentoPlaceholder(Buffer.from(Array.from(yarisSample).flatMap(x=>[x,x,x]))),true));
const rgb=Buffer.from(Array.from(sample).flatMap(x=>[x,x,x]));
test('recognizes reported Magento placeholder',()=>assert.equal(isMagentoPlaceholder(rgb),true));
test('does not treat white photographs as Magento logos',()=>assert.equal(isMagentoPlaceholder(Buffer.alloc(96*96*3,248)),false));
test('does not hide a different low contrast shape',()=>{const image=Buffer.alloc(96*96*3,248);for(let y=20;y<76;y++)for(let x=20;x<76;x++)image.fill(240,(y*96+x)*3,(y*96+x)*3+3);assert.equal(isMagentoPlaceholder(image),false)});
test('does not hide images with dark or saturated content',()=>{const image=Buffer.from(rgb);image[0]=100;assert.equal(isMagentoPlaceholder(image),false)});
