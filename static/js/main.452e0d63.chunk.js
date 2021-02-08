(this["webpackJsonpmy-app"]=this["webpackJsonpmy-app"]||[]).push([[0],{33:function(n,t){function e(n){var t=new Error("Cannot find module '"+n+"'");throw t.code="MODULE_NOT_FOUND",t}e.keys=function(){return[]},e.resolve=e,n.exports=e,e.id=33},34:function(n,t){},43:function(n,t,e){},57:function(n,t){},58:function(n,t){},59:function(n,t){},60:function(n,t){},61:function(n,t){},62:function(n,t){},78:function(n,t){},79:function(n,t){},80:function(n,t){},84:function(n,t){},87:function(n,t,e){"use strict";e.r(t);var r=e(1),i=e.n(r),c=e(36),o=e.n(c),a=(e(43),e(5)),u=e(4),f=e(24),s="\n// paste spec here\n\n// example:\n\ndescribe('test D', () => {\n\n\tbefore(() => {\n\t\tbeforeCommand();\n\t});\n\n\tit('should test 1', () => {\n\t\tcommand1();\n\t});\n\n\tit('should test 2', () => {\n\t\tcommand2();\n\t});\n\n});\n",l=e(2);function d(n){return(new l.Project).createSourceFile("code.ts",n)}function h(n){if(l.Node.isExpressionStatement(n)){var t=n.getExpression();if(l.Node.isCallExpression(t)){var e=t.getExpression();if(l.Node.isIdentifier(e)||l.Node.isPropertyAccessExpression(e))return e.getText()}}return""}function p(n,t){var e;return n.forEachChild((function(n){n.getKind()===t&&(e=n)})),e}function b(n){var t=[];return n.forEachChild((function(n){l.Node.isBlock(n)?t.push(n):t.push.apply(t,Object(a.a)(b(n)))})),t}function v(n){var t=p(n,l.SyntaxKind.CallExpression);if(t){var e=p(t,l.SyntaxKind.FunctionExpression)||p(t,l.SyntaxKind.ArrowFunction);if(e)return p(e,l.SyntaxKind.Block)}}var x=e(37),j=e.n(x),g=e(38),m=e.n(g);function O(n){return n.trim().substring(1,n.length-1)}var E=["afterEach","after","beforeEach","before"];function y(n){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,e=[];return n.forEachChild((function(n){var r=P(n,"describe");r&&e.push({title:I(n),level:t,node:n}),e.push.apply(e,Object(a.a)(y(n,r?t+1:t)))})),e}function S(n,t){t.forEach((function(n){n.node.replaceWithText(function(n){var t=v(n);if(!t)return"";var e="",r=function(n){var t=W(n),e=t.filter((function(n){return P(n,"before")})),r=t.filter((function(n){return P(n,"after")}));return[].concat(Object(a.a)(e),Object(a.a)(r)).map((function(n){return n.getFullText()})).join("\n")}(t),i=F(t,e),c=D(W(t).filter((function(n){return!A(n)})));return"\n    describe".concat(B(n)?".skip":"","(").concat(V(I(n)),", () => {\n      ").concat(w(c.before,e),"\n      \n      ").concat(r,"\n      \n      it('should pass', () => {\n        ").concat(w(c.main,e,i),"\n      });\n    });\n  ")}(n.node))}));try{return j.a.format(n.getText(),{parser:"typescript",plugins:[m.a],useTabs:!0,singleQuote:!0,trailingComma:"all",arrowParens:"always",endOfLine:"lf"})}catch(e){return n.formatText(),n.getText()}}function C(n){return W(n).reduce((function(n,t){return!!n||(!(!P(t,"it")&&!P(t,"describe"))||C(t))}),!1)}function T(n,t,e){return P(n,"describe")?function(n,t,e){var r=v(n);if(!r)return"";var i=D(W(r)),c=k(t,I(n)),o=F(r,c),a="\n    ".concat(w(i.before,c),"\n\n    ").concat(w(i.main,c,o),"\n\n    ").concat(w(i.after,c),"\n  ");J(r)||(a="{\n      ".concat(a,"\n    }"));a=K(a,e),B(n)&&(a=U(a));return a}(n,t,e):P(n,"it")?function(n,t,e){var r=v(n);if(!r)return"";var i="\n    ".concat(N(t,n),"\n    ").concat(M(r),"\n  ");i=K(i,e),B(n)&&(i=U(i));return i}(n,t,e):A(n)?function(n,t){var e=v(n);return e?"\n    ".concat(N(t,n),"\n    ").concat(M(e),"\n  "):""}(n,t):l.Node.isBlock(n)?function(n,t,e){var r=[];return n.forEachChild((function(n){r.push(T(n,t,e))})),r.join("\n")}(n,t,e):(C(n)&&function(n,t,e){b(n).forEach((function(n){n.replaceWithText("{".concat(T(n,t,e),"}"))}))}(n,t,e),n.getFullText())}function w(n,t,e){return n.map((function(n){return T(n,t,e)})).join(" ")}function N(n,t){var e="".concat(h(t)," ").concat(I(t)).trim();return"cy.log(".concat(V(k(n,e)),");")}function k(n,t){return"".concat(n?"".concat(n," - "):"").concat(t)}function F(n,t){return{beforeEach:L(n,"beforeEach",t),afterEach:L(n,"afterEach",t)}}function L(n,t,e){return W(n).filter((function(n){return P(n,t)})).map((function(n){return T(n,e)})).join("\n")}function K(n,t){return t?t.beforeEach+n+t.afterEach:n}function D(n){var t={before:[],main:[],after:[]},e=t.before;return n.forEach((function(n){P(n,"before")?t.before.push(n):P(n,"after")?t.after.push(n):A(n)||((P(n,"it")||P(n,"describe")||C(n))&&(e=t.main),e.push(n))})),t}function P(n,t){if(l.Node.isExpressionStatement(n)){var e=h(n);return e===t||e==="".concat(t,".skip")}return!1}function B(n){return!!l.Node.isExpressionStatement(n)&&h(n).endsWith(".skip")}function A(n){if(l.Node.isExpressionStatement(n)){var t=h(n);return E.includes(t)}return!1}function I(n){var t=p(n,l.SyntaxKind.CallExpression);if(!t)return"";var e=p(t,l.SyntaxKind.StringLiteral);if(e)return O(e.getText());var r=p(t,l.SyntaxKind.TemplateExpression);return r?O(r.getText()):""}function W(n){var t=[];return n.forEachChild((function(n){t.push(n)})),t}function J(n){var t=!0;return n.forEachChild((function(n){(l.Node.isVariableStatement(n)||l.Node.isFunctionDeclaration(n))&&(t=!1)})),t}function M(n){return J(n)?O(n.getText()):n.getFullText()}function U(n){return"\n    {\n      const skip = true;\n      if (!skip) {\n        ".concat(n,"\n      }\n    }\n  ")}function V(n){return n.match(/.*\$\{.*\}.*/)?"`"+n+"`":"'".concat(n,"'")}var _=e(3);var Q=function(){var n=Object(r.useState)(d(s)),t=Object(u.a)(n,2),e=t[0],i=t[1],c=Object(r.useState)([]),o=Object(u.a)(c,2),l=o[0],h=o[1],p=Object(r.useState)([]),b=Object(u.a)(p,2),v=b[0],x=b[1],j=Object(r.useState)(""),g=Object(u.a)(j,2),m=g[0],O=g[1];return Object(r.useEffect)((function(){var n;if(e){var t=d(e.getFullText()),r=y(null===(n=t.getFirstChild())||void 0===n?void 0:n.getParent()).filter((function(n,t){return l.includes(t)}));O(S(t,r))}}),[e,l]),Object(_.jsxs)("div",{className:"App",style:{display:"flex",flexDirection:"row",overflowY:"hidden"},children:[Object(_.jsx)(f.a,{height:"100vh",width:"40vw",defaultLanguage:"typescript",defaultValue:s,onChange:function(n){x([]),h([]),n&&i(d(n))},options:{minimap:{enabled:!1},lineNumbers:"off"}}),Object(_.jsxs)("div",{style:{width:"20vw",padding:20,borderLeft:"1px solid lightgrey",borderRight:"1px solid lightgrey"},children:[Object(_.jsxs)("h2",{children:["source spec -",">"," flattened spec"]}),"Select ",Object(_.jsx)("i",{children:"describes"})," you want to flatten:",Object(_.jsx)("br",{}),Object(_.jsx)("br",{}),e&&y(e).map((function(n,t){return Object(_.jsxs)("div",{children:[Object(_.jsxs)("label",{style:{paddingLeft:20*n.level},children:[Object(_.jsx)("input",{type:"checkbox",checked:l.includes(t),disabled:v.includes(t),onChange:function(n){h((function(r){return function(n,t,r){if(!e)return[];var i=y(e),c=Object(a.a)(n),o=Object(a.a)(v);if(r?c.push(t):c=c.filter((function(n){return n!==t})),t<i.length-1)for(var u=i.map((function(n,t){return{node:n,index:t}})).slice(t+1),f=!0,s=0;s<u.length&&f;s++)u[s].node.level<=i[t].level?f=!1:function(){var n=u[s].index;r?(c=c.filter((function(t){return t!==n})),o.includes(n)||o.push(n)):o=o.filter((function(t){return t!==n}))}();return x(o),c}(r,t,n.target.checked)}))}})," ",n.title]}),Object(_.jsx)("br",{})]},t)}))]}),Object(_.jsx)("div",{children:Object(_.jsx)(f.a,{height:"100vh",width:"40vw",defaultLanguage:"typescript",value:m,options:{readOnly:!0,minimap:{enabled:!1},lineNumbers:"off"}})})]})},R=function(n){n&&n instanceof Function&&e.e(3).then(e.bind(null,88)).then((function(t){var e=t.getCLS,r=t.getFID,i=t.getFCP,c=t.getLCP,o=t.getTTFB;e(n),r(n),i(n),c(n),o(n)}))};o.a.render(Object(_.jsx)(i.a.StrictMode,{children:Object(_.jsx)(Q,{})}),document.getElementById("root")),R()}},[[87,1,2]]]);
//# sourceMappingURL=main.452e0d63.chunk.js.map