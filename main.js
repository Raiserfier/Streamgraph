var n = 20;// 层数
var m = 200;// 每层样本数
var k = 10;// 每层颠簸总数

// 获取svg元素
var svg0 = document.getElementById("svg");
var svg1 = document.getElementById("svg1");
var svg2 = document.getElementById("svg2");
let svg_width = +svg0.getAttribute("width");// 获得HTML中svg的宽度
let svg_height = +svg0.getAttribute("height");// 获得HTML中svg的高度

var data_layers = Create_layers();// 生成数据
var layers = data_layers[0];// 普通的单层数据
var stack = data_layers[1];// 初始化栈
var weight = data_layers[2];// 每一层的值之和
var max_weight = data_layers[3];// 最大值
var layers2 = data_layers[4];// 乘了系数的单层数据，方便之后计算wiggle
var stack2 = data_layers[5];// 初始化存放layer2数据的栈

var data_stack = Create_stack(stack, stack2, layers, layers2);// 构建堆叠图栈
stack = data_stack[0];
stack2 = data_stack[3];
var alpha_x = data_stack[1];// x坐标轴比例系数
var H_max = data_stack[2];// 数据最大高度， 为之后计算y坐标轴比例系数做准备

Draw(svg0, weight, max_weight, stack, stack2, alpha_x, H_max, -1);
Draw(svg1, weight, max_weight, stack, stack2, alpha_x, H_max, 0);
Draw(svg2, weight, max_weight, stack, stack2, alpha_x, H_max, 1);

function Draw(svg, weight, max_weight, stack, stack2, alpha_x, H_max, type) {
    var G0 = Create_G0(stack, type, stack2);
    var g0 = G0[0];
    var H_max_g0 = G0[1];
    var height;
    // 如果 g0=0 则要在最底下绘制；其他情况需要将高度调整至大约一半位置
    if (type != -1)
        height = svg_height / 2;
    else
        height = svg_height;
    // 根据数据的高度和g0的高度计算y坐标轴比例系数
    var alpha_y = (svg_height / (H_max + H_max_g0)).toFixed(2);
    for (var q = n - 1; q >= 0; q--) {
        // 测试感觉320（红）到240（蓝紫）的效果挺好
        var RGB = Color_creator(weight, max_weight, 320, 240, q, n);
        // console.log(RGB);
        var color = 'rgb(' + parseInt(RGB[0]) + ',' + parseInt(RGB[1]) + ',' + parseInt(RGB[2]) + ')';
        // 绘制单层数据的path
        var path = createPath_layers(g0, stack[q], 0.1, alpha_x, alpha_y, q, height);
        // 填充颜色
        path.setAttribute('fill', color);
        svg.appendChild(path);
    }
    // 绘制g0的path
    var path_g0 = createPath_g0(g0, 1, alpha_x, alpha_y, n, height);
    svg.appendChild(path_g0);
}

// 更新函数 鼠标点击update
function Update_svg() {
    // 点击将svg中现有的path清空
    document.querySelector('#svg').innerHTML = '';
    document.querySelector('#svg1').innerHTML = '';
    document.querySelector('#svg2').innerHTML = '';

    // 重新绘制
    var data_layers = Create_layers();// 生成数据
    var layers = data_layers[0];
    var stack = data_layers[1];
    var weight = data_layers[2];
    var max_weight = data_layers[3];
    var layers2 = data_layers[4];
    var stack2 = data_layers[5];

    var data_stack = Create_stack(stack, stack2, layers, layers2);// 构建堆叠图栈
    stack = data_stack[0];
    stack2 = data_stack[3];
    var alpha_x = data_stack[1];
    var H_max = data_stack[2];

    Draw(svg0, weight, max_weight, stack, stack2, alpha_x, H_max, -1);
    Draw(svg1, weight, max_weight, stack, stack2, alpha_x, H_max, 0);
    Draw(svg2, weight, max_weight, stack, stack2, alpha_x, H_max, 1);
}

// 生成数据
function Create_layers() {
    var layers = [];// 单层
    var layers2 = [];
    var stack = [];// 堆叠图
    var stack2 = [];
    var weight = [];// 权重 用于layer排序
    for (var i = 0; i < n; i++) {
        layers[i] = [];
        layers2[i] = [];
        stack[i] = [];
        stack2[i] = [];
        weight[i] = [];

        layers[i] = bumps(m, k);
        weight[i] = eval(layers[i].join("+"));

        // sorting 若前半部分的权重低于后半部分，则将新的单层数据放到第一个，反之放到最后一个
        if (i > 1) {
            var half_list = ((i - 1) / 2).toFixed(0) + 1;
            var fro_weight = 0;
            var beh_weight = 0;
            for (var h = 0; h < half_list; h++) {
                fro_weight += weight[h];
            }
            for (var h = half_list; h < i - 1; h++) {
                beh_weight += weight[h];
            }
            if (fro_weight < beh_weight) {
                var temp = layers[i];
                var temp2 = weight[i];
                for (var l = i - 1; l >= 0; l--) {// 全体向后移动一个单位，第一个放原来的最后一个
                    layers[l + 1] = layers[l];
                    weight[l + 1] = weight[l]// weight也要相应调整
                }
                layers[0] = temp;
                weight[0] = temp2;
            }
        }
    }
    for (var i = 0; i < n; i++) {
        for (var c = 0; c < m; c++)
            layers2[i][c] = (n - i + 1) * layers[i][c];// 排序完成后将乘上系数的layer存放到layer2中
    }
    var max_weight = Math.max.apply(null, weight);
    return [layers, stack, weight, max_weight, layers2, stack2];
}

// 构建堆叠图栈
function Create_stack(stack, stack2, layers, layers2) {
    for (var i = 0; i < n; i++) {
        stack[i] = layers[i];
        stack2[i] = layers2[i];
        if (i > 0) {
            for (var j = 0; j < m; j++) {
                stack[i][j] += stack[i - 1][j];// 数据叠加
                stack2[i][j] += stack2[i - 1][j];
            }
        } else {
            stack[0] = layers[0];
            stack2[0] = layers2[0];
        }
    }
    var H_max = Math.max.apply(null, stack[n - 1]);
    var alpha_x = (svg_width / m).toFixed(2);
    return [stack, alpha_x, H_max, stack2];
}

// 构建基底g0
function Create_G0(stack, type, stack2) {
    var g0 = [];
    // console.log(stack2);
    if (type === 0) {
        // 基底layer -1/2（f1+f2+...+fn）
        for (var j = 0; j < m; j++) {
            g0[j] = -0.5 * stack[n - 1][j];
        }
    } else if (type === 1) {
        // 基底layer wiggle = -1/(n+1) * ( n*f1 + (n-1)*f2 + ... + fn )
        for (var j = 0; j < m; j++) {
            g0[j] = -1 / (n + 1) * stack2[n - 1][j];
        }
    } else {
        // 基底g0 = 0
        for (var j = 0; j < m; j++) {
            g0[j] = 0;
        }
    }
    var H_max_g0 = Math.abs(Math.min.apply(null, g0));
    return [g0, H_max_g0];
}

// 根据layers数据 创建svg path对象
function createPath_layers(g0, stack_layer, line_width, alpha_x, alpha_y, id, height) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var start_y = (-alpha_y * (stack_layer[0] + g0[0]) + height).toFixed(2);
    // alpha_y = alpha_y / 2;
    // svg绘图 M：移动到点 L：绘制直线
    var dA = ["M" + 0, start_y, "L"];
    for (var j = 1; j < m; j++) {
        dA.push((j * alpha_x).toFixed(2));
        dA.push((-alpha_y * (stack_layer[j] + g0[j]) + height).toFixed(2));
        // svg原点在左上角，因此坐标需要相对调整
        // alpha_x alpha_y比例系数让graph尽量铺满整个svg
    }
    // 最后补齐点 形成封闭图形 方便填充
    dA.push(((m - 1) * alpha_x).toFixed(2));
    dA.push((-alpha_y * (stack_layer[m - 1] + g0[m - 1]) + height));
    dA.push(((m - 1) * alpha_x).toFixed(2));
    dA.push(svg_height);
    dA.push(0);
    dA.push(svg_height);
    dA.push(0);
    dA.push(start_y);
    var d = dA.join(" ");
    // 设置path属性
    path.setAttribute('fill-opacity', '0');
    path.setAttribute('id', id);
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'white');
    path.setAttribute('stroke-width', line_width);

    return path;
}

// 根据g0类别 创建svg path对象
function createPath_g0(g0, line_width, alpha_x, alpha_y, id, height) {
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var start_y = (-alpha_y * g0[0] + height).toFixed(2);
    // alpha_y = alpha_y / 2;
    var dA = ["M" + 0, start_y, "L"];
    for (var j = 1; j < m; j++) {
        dA.push((j * alpha_x).toFixed(2));
        dA.push((-alpha_y * g0[j] + height).toFixed(2));
    }

    dA.push(((m - 1) * alpha_x).toFixed(2));
    dA.push((-alpha_y * g0[m - 1] + height).toFixed(2));
    dA.push(((m - 1) * alpha_x).toFixed(2));
    dA.push(svg_height);
    dA.push(0);
    dA.push(svg_height);
    dA.push(0);
    dA.push(start_y);
    var d = dA.join(" ");
    path.setAttribute('id', id);
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'none');
    path.setAttribute('stroke-width', line_width);
    path.setAttribute('fill', 'white');

    return path;
}

// 根据参数生成对应颜色 hsb模型相较rgb模型更直观，因此选用hsb模型
function Color_creator(weight, max_weight, H_theta1, H_theta2, i, n) {
    // H_theta1 和 H_theta2是色环的角度，对应两个端点的颜色
    // 根据层数在两个端点颜色之间划分单位区间，可以实现渐变效果
    var H_factor = (H_theta2 - H_theta1) / n;
    var h = H_theta1 + i * H_factor;
    // 实际观察s设置在0.5比较合适
    // var s = 1 - (weight[i] / max_weight) * 0.7;
    var s = 0.5;
    // 根据单层数据的权重设置v 此处设置权重比较小的亮度较高，反之较暗，即区域越小越亮
    var v = 1 - (weight[i] / max_weight) * 0.3;
    // var v = 0.8;

    return hsb2rgb(h, s, v);
}

// hsb转rgb path参数好像不接受hsb，所以需要转换
function hsb2rgb(h, s, v) {
    var r = 0, g = 0, b = 0;
    var i = ((h / 60) % 6).toFixed(0);
    var f = (h / 60) - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    if (i == 0) {
        r = v;
        g = t;
        b = p;
    } else if (i == 1) {
        r = q;
        g = v;
        b = p;
    } else if (i == 2) {
        r = p;
        g = v;
        b = t;
    } else if (i == 3) {
        r = p;
        g = q;
        b = v;
    } else if (i == 4) {
        r = t;
        g = p;
        b = v;
    } else if (i == 5) {
        r = v;
        g = p;
        b = q;
    }
    var RGB = [];
    RGB.push(r * 255);
    RGB.push(g * 255);
    RGB.push(b * 255);

    return RGB;
}

// 该方法用于生成长度为n的数组，其中通过m次颠簸，即调用dump(a,n)方法来变换a数组,最终返回变换后的a数组
function bumps(n, m) {
    var a = [], i;
    for (i = 0; i < n; ++i) a[i] = 0;
    for (i = 0; i < m; ++i) bump(a, n);
    return a;
}

// 该方法通过一定的随机数的运算来变换数组a的值
function bump(a, n) {
    var x = 1 / (0.1 + Math.random()),
        y = 2 * Math.random() - 0.5,
        z = 10 / (0.1 + Math.random());
    for (var i = 0; i < n; i++) {
        var w = (i / n - y) * z;
        a[i] += x * Math.exp(-w * w);
    }
}

