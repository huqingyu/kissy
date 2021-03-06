/**
 * @ignore
 * node
 * @author yiminghe@gmail.com
 */
KISSY.add(function (S, require) {
    var Node = require('node/base');

    require('node/attach');
    require('node/override');
    require('node/anim');

    // bad! compatibility
    S.Node = Node;
    S.all = Node.all;
    S.one = Node.one;

    return Node;
});