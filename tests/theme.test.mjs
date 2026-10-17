import test from 'node:test';
import assert from 'node:assert/strict';
import {parseThemeMode,resolveTheme,THEME_STORAGE_KEY} from '../src/lib/theme.ts';

test('theme preference defaults to system for missing or invalid values',()=>{
 for(const invalid of [null,undefined,'', 'auto','LIGHT', 'dark-theme', {},123])
  assert.equal(parseThemeMode(invalid),'system');
 for(const valid of ['light','dark','system'])
  assert.equal(parseThemeMode(valid),valid);
});
test('device appearance is respected only while in automatic mode',()=>{
 assert.equal(resolveTheme('system',true),'dark');
 assert.equal(resolveTheme('system',false),'light');
 assert.equal(resolveTheme('light',true),'light');
 assert.equal(resolveTheme('dark',false),'dark');
});
test('theme settings use a namespaced key',()=>assert.equal(THEME_STORAGE_KEY,'nutricarsi-theme'));
