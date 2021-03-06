/**
 * native commands for xtemplate.
 * @author yiminghe@gmail.com
 * @ignore
 */
KISSY.add(function (S, require) {
    var Scope = require('./scope');

    var commands = {
        each: function (scope, option, buffer) {
            var params = option.params;
            var param0 = params[0];
            var xindexName = params[2] || 'xindex';
            var valueName = params[1];
            var xcount;
            var opScope;
            var affix;
            // if undefined, will emit warning by compiler
            if (param0) {
                if (S.isArray(param0)) {
                    xcount = param0.length;
                    opScope = new Scope();
                    affix = opScope.affix = {
                        xcount: xcount
                    };
                    for (var xindex = 0; xindex < xcount; xindex++) {
                        // two more variable scope for array looping
                        opScope.data = param0[xindex];
                        affix[xindexName] = xindex;
                        if (valueName) {
                            affix[valueName] = param0[xindex];
                        }
                        opScope.setParent(scope);
                        buffer = option.fn(opScope, buffer);
                    }
                } else {
                    opScope = new Scope();
                    affix = opScope.affix = {};
                    for (var name in param0) {
                        opScope.data = param0[name];
                        affix[xindexName] = name;
                        if (valueName) {
                            affix[valueName] = param0[name];
                        }
                        opScope.setParent(scope);
                        buffer = option.fn(opScope, buffer);
                    }
                }
            }
            return buffer;
        },

        'with': function (scope, option, buffer) {
            var params = option.params;
            var param0 = params[0];
            if (param0) {
                // skip object check for performance
                var opScope = new Scope(param0);
                opScope.setParent(scope);
                buffer = option.fn(opScope, buffer);
            }
            return buffer;
        },

        'if': function (scope, option, buffer) {
            var params = option.params;
            var param0 = params[0];
            if (param0) {
                if (option.fn) {
                    buffer = option.fn(scope, buffer);
                }
            } else if (option.inverse) {
                buffer = option.inverse(scope, buffer);
            }
            return buffer;
        },

        set: function (scope, option, buffer) {
            scope.mix(option.hash);
            return buffer;
        },

        include: function (scope, option, buffer, lineNumber, payload) {
            var params = option.params;
            // sub template scope
            if (option.hash) {
                var newScope = new Scope(option.hash);
                newScope.setParent(scope);
                scope = newScope;
            }
            return this.include(params[0], scope, buffer, payload);
        },

        parse: function (scope, option, buffer, lineNumber, payload) {
            // abandon scope
            return commands.include.call(this, new Scope(), option, buffer, payload);
        },

        extend: function (scope, option, buffer, lineNumber, payload) {
            payload.extendTplName = option.params[0];
            return buffer;
        },

        block: function (scope, option, buffer, lineNumber, payload) {
            var self = this;
            var params = option.params;
            var blockName = params[0];
            var type;
            if (params.length === 2) {
                type = params[0];
                blockName = params[1];
            }
            var blocks = payload.blocks = payload.blocks || {};
            var head = blocks[blockName],
                cursor;
            var current = {
                fn: option.fn,
                type: type
            };
            if (!head) {
                blocks[blockName] = current;
            } else if (head.type) {
                if (head.type === 'append') {
                    current.next = head;
                    blocks[blockName] = current;
                } else if (head.type === 'prepend') {
                    var prev;
                    cursor = head;
                    while (cursor && cursor.type === 'prepend') {
                        prev = cursor;
                        cursor = cursor.next;
                    }
                    current.next = cursor;
                    prev.next = current;
                }
            }

            if (!payload.extendTplName) {
                cursor = blocks[blockName];
                while (cursor) {
                    if (cursor.fn) {
                        buffer = cursor.fn.call(self, scope, buffer);
                    }
                    cursor = cursor.next;
                }
            }

            return buffer;
        },

        macro: function (scope, option, buffer, lineNumber, payload) {
            var params = option.params;
            var macroName = params[0];
            var params1 = params.slice(1);
            var self = this;
            var macros = payload.macros = payload.macros || {};
            // definition
            if (option.fn) {
                macros[macroName] = {
                    paramNames: params1,
                    fn: option.fn
                };
            } else {
                var paramValues = {};
                var macro = macros[macroName];
                var paramNames;
                if (macro && (paramNames = macro.paramNames)) {
                    for (var i = 0, len = paramNames.length; i < len; i++) {
                        var p = paramNames[i];
                        paramValues[p] = params1[i];
                    }
                    var newScope = new Scope(paramValues);
                    // no caller Scope
                    buffer = macro.fn.call(self, newScope, buffer);
                } else {
                    var error = 'in file: ' + self.name + ' can not find macro: ' + name + '" at line ' + lineNumber;
                    S.error(error);
                }
            }
            return buffer;
        }
    };

    if ('@DEBUG@') {
        commands['debugger'] = function () {
            S.globalEval('debugger');
        };
    }

    return commands;
});