/** @jest-environment node */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const root=fileURLToPath(new URL('../',import.meta.url));
const fixturePath=`${root}__fixtures__/ForecastAccuracyMetrics.generated.ts.txt`;
const shimPath=`${root}generated-types.d.ts`;
// Parse both the one-line generated alias and the ambient alias. Reject syntax
// we do not understand instead of passing an empty/partial field comparison.
function fields(source:string):string[] {
  const tree=ts.createSourceFile('shape.ts',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const aliases:ts.TypeAliasDeclaration[]=[];
  function visit(node:ts.Node) {if(ts.isTypeAliasDeclaration(node)&&node.name.text==='ForecastAccuracyMetrics')aliases.push(node);ts.forEachChild(node,visit);}
  visit(tree);
  if(aliases.length!==1||!ts.isTypeLiteralNode(aliases[0].type))throw Error('expected one metrics object alias');
  const members=(aliases[0].type as ts.TypeLiteralNode).members;
  if(!members.length)throw Error('metrics fields are empty');
  const names=members.map(member=>{
    if(!ts.isPropertySignature(member)||!ts.isIdentifier(member.name)||member.questionToken||member.type?.kind!==ts.SyntaxKind.NumberKeyword)throw Error('metrics fields must be required numbers');
    return member.name.text;
  });
  if(new Set(names).size!==names.length)throw Error('duplicate metrics field');
  return names.sort();
}
function compare(fixture:string,shim:string):string[] {
  const generated=fields(fixture);const ambient=fields(shim);
  return [...generated.filter(name=>!ambient.includes(name)).map(name=>`missing:${name}`),...ambient.filter(name=>!generated.includes(name)).map(name=>`extra:${name}`)];
}
it('pins the ambient alias to a provenance-labelled backend generated snapshot',()=>{
  const fixture=readFileSync(fixturePath,'utf8');const shim=readFileSync(shimPath,'utf8');
  expect(fixture.split('\n')[0]).toBe('// Snapshot: wrfcoin/backend@880bc51b7cf37d7fd11c8945daad2cdf958acdc6 shared/generated-types/ForecastAccuracyMetrics.ts');
  // Body bytes verified with git show at the named backend commit. The source
  // banner is retained verbatim; it does not establish a working ts-rs exporter.
  expect(createHash('sha256').update(fixture.slice(fixture.indexOf('\n')+1)).digest('hex'))
    .toBe('5c4d91377aba4022188fe46bb768000d09f2fd59b80da91d5908cfb676e22abc');
  expect(compare(fixture,shim)).toEqual([]);expect(fields(fixture)).toEqual(['bias','mae','rmse','skill_score']);
});
it('reports an extra generated field instead of silently accepting drift',()=>{
  const fixture=readFileSync(fixturePath,'utf8');const shim=readFileSync(shimPath,'utf8');
  expect(compare(fixture.replace('mae: number','new_metric: number, mae: number'),shim)).toEqual(['missing:new_metric']);
  expect(compare(fixture,shim.replace('mae: number','old_metric: number; mae: number'))).toEqual(['extra:old_metric']);
});
it.each(['string','number | null'])('rejects a %s field type',type=>{
  const fixture=readFileSync(fixturePath,'utf8');expect(()=>fields(fixture.replace('mae: number',`mae: ${type}`))).toThrow(/required numbers/);
});
it('rejects optional, empty, duplicate and unparseable shapes',()=>{
  for(const source of ['export type ForecastAccuracyMetrics = {};','export type ForecastAccuracyMetrics = {mae?: number};','export type ForecastAccuracyMetrics = {mae:number;mae:number};','export type ForecastAccuracyMetrics = number;'])expect(()=>fields(source)).toThrow();
});
