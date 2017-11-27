'use strict';Object.defineProperty(exports,'__esModule',{value:true});exports.default=function(babel){var t=babel.types;return{visitor:{ImportDeclaration:function ImportDeclaration(path,state){var node=path.node;var dec=void 0;var pathAliases={'.':_path4.default.dirname(state.file.opts.filename)// get path of current file
};Object.assign(pathAliases,state.opts.aliases||{});// Support webpack aliases
if(state.opts.useWebpackAliases){var webpackConfigFile=state.opts.webpackConfigFile||'./webpack.config.js';if(webpackConfigFile[0]==='.'||webpackConfigFile[0]!==_path4.default.sep){webpackConfigFile=_path4.default.join(process.cwd(),webpackConfigFile.substring(2))}var webpackConfig=require(webpackConfigFile);if(typeof webpackConfig==='function'){webpackConfig=webpackConfig()}Object.assign(pathAliases,webpackConfig.resolve&&webpackConfig.resolve.alias||{})}// add relative root alias to provided aliases
for(var alias in pathAliases){var _path2=pathAliases[alias];if(_path2.length>1&&_path2[0]==='.'){pathAliases[alias]=pathAliases['.']+_path2.substring(1)}}// All the extensions that we should look at
var exts=state.opts.exts||['js','es6','es','jsx'];var src=path.node.source.value.split(_path4.default.sep);// replace the alias with the actual path
var originalRoot=src[0];var newRoot=pathAliases[src[0]]||src[0];src[0]=newRoot;src=src.join(_path4.default.sep);var wildcardName=void 0;// Name of the variable the wilcard will go in
// not set if you have a filter { A, B, C }
var filterNames=[];// e.g. A, B, C
// has a /* specifing explicitly to use wildcard
var wildcardRegex=new RegExp('\\'+_path4.default.sep+'([^\\'+_path4.default.sep+']*\\*[^\\'+_path4.default.sep+']*)$');var isExplicitWildcard=wildcardRegex.test(src);var filenameRegex=new RegExp('.+');// in the above case we need to remove the trailing /*
if(isExplicitWildcard){var lastSlash=src.lastIndexOf(_path4.default.sep);var filenameGlob=src.substring(lastSlash+1).split('.');src=src.substring(0,lastSlash);var ext=filenameGlob[filenameGlob.length-1];if(!!~exts.indexOf(ext)){// filename ends in one of the extensions
// so only look for those files
exts=[ext];// and remove the extension from the glob
filenameGlob.splice(-1,1)}filenameRegex=filenameGlob.join('.').replace(/[*\.\(\[\)\]]/g,function(character){switch(character){case'*':return'.*';case'(':case')':case'[':case']':case'.':return'\\'+character;}return character});filenameRegex=new RegExp(filenameRegex)}if(!_fs3.default.existsSync(src)){// the path doesn't exist, so don't bother
return}if(!isExplicitWildcard){// bypass resolution check if this is explicitly a wildcard path
try{require.resolve(src);// the path resolves to a module normally so we shouldn't touch this
return}catch(err){// if this errors it means the path doesn't automatically resolve to a module
// in which case we need to see if we can apply the wildcard
// as such, just swallow this error
}}var files=[];for(var i=node.specifiers.length-1;i>=0;i--){dec=node.specifiers[i];if(t.isImportNamespaceSpecifier(dec)){wildcardName=dec.local.name}if(t.isImportSpecifier(dec)){// This handles { A, B, C } from 'C/*'
// original: the actual name to lookup
// local: the name to import as, may be same as original
// We do this because of `import { A as B }`
filterNames.push({original:dec.imported.name,local:dec.local.name})}node.specifiers.splice(i,1)}// Add the original object. `import * as A from 'foo';`
//  this creates `const A = {};`
// For filters this will be empty anyway
if(!filterNames.length&&wildcardName){var obj=t.variableDeclaration('const',[t.variableDeclarator(t.identifier(wildcardName),t.objectExpression([]))]);path.insertBefore(obj)}// Will throw if the path does not point to a dir
try{var r=_fs3.default.readdirSync(src);for(var i=0;i<r.length;i++){// Check extension is of one of the aboves
var _path$parse=_path4.default.parse(r[i]),name=_path$parse.name,_ext=_path$parse.ext;if(exts.indexOf(_ext.substring(1))>-1&&filenameRegex.test(name)){files.push(r[i])}}}catch(e){console.warn(src+' is not a directory.');return}// remove the absolute root
src=src.replace(newRoot,'').substring(1);// This is quite a mess but it essentially formats the file
// extension, and adds it to the object
for(var i=0;i<files.length;i++){// name of temp. variable to store import before moved
// to object
var id=path.scope.generateUidIdentifier('wcImport');var file=files[i];// Strip extension
var fancyName=file.replace(/(?!^)\.[^.\s]+$/,'');// Handle dotfiles, remove prefix `.` in that case
if(fancyName[0]==='.'){fancyName=fancyName.substring(1)}// If we're allowed to camel case, which is default, we run it
// through this regex which converts it to a PascalCase variable.
if(state.opts.noCamelCase!==true){fancyName=fancyName.match(/[A-Z][a-z]+(?![a-z])|[A-Z]+(?![a-z])|([a-zA-Z\d]+(?=-))|[a-zA-Z\d]+(?=_)|[a-z]+(?=[A-Z])|[A-Za-z0-9]+/g).map(function(s){return s[0].toUpperCase()+s.substring(1)}).join('')}// Now we're 100% settled on the fancyName, if the user
// has provided a filer, we will check it:
if(filterNames.length>0){// Find a filter name
var res=null;for(var j=0;j<filterNames.length;j++){if(filterNames[j].original===fancyName){res=filterNames[j];break}}if(res===null)continue;fancyName=res.local}// This will remove file extensions from the generated `import`.
// This is useful if your src/ files are for example .jsx or
// .es6 but your generated files are of a different extension.
// For situations like webpack you may want to disable this
file=state.opts.nostrip!==true?_path4.default.basename(file):file;var name=originalRoot+'/'+_path4.default.join(src,file);// Special behavior if 'filterNames'
if(filterNames.length>0){path.insertAfter(t.importDeclaration([t.importDefaultSpecifier(t.identifier(fancyName))],t.stringLiteral(name)));continue}if(wildcardName){// Assign it
path.insertAfter(t.expressionStatement(t.assignmentExpression('=',t.memberExpression(t.identifier(wildcardName),t.stringLiteral(fancyName),true),id)));// Generate temp. import declaration
path.insertAfter(t.importDeclaration([t.importDefaultSpecifier(id)],t.stringLiteral(name)))}else{// if wildcardName is falsy it means the import doesn't get "captured"
// e.g. import "./something/*"
path.insertAfter(t.importDeclaration([],t.stringLiteral(name)))}}if(path.node.specifiers.length===0){path.remove()}}}}};var _path3=require('path');var _path4=_interopRequireDefault(_path3);var _fs2=require('fs');var _fs3=_interopRequireDefault(_fs2);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}