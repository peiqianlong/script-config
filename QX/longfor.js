// 龙珠签到
const {
  AnError,
  isRequest,
  isJSBox,
  isSurge,
  isQuanX,
  isLoon,
  isNode,
  notify,
  write,
  read,
  get,
  post,
  time,
  done,
} = nobyda();

function Start(headers) {
  const a = new Promise((resolve, rejects) => {
    LHSing(headers, function (err, res, body) {
      const r = JSON.parse(body);
      if (r.code == '0000') {
        notify('龙珠签到', '', '签到成功' + body);
      } else {
        notify('龙珠签到', '', '签到失败' + body);
      }
      resolve();
    });
  });
  Promise.all([a]).then(() => {
    done();
  });
}


function LHSing(headers, cb) {
  const url = `https://longzhu.longfor.com/proxy/lmarketing-task-api-mvc-prod/openapi/task/v1/signature/clock`;
  const method = `POST`;
  const body = `{"activity_no":"11111111111686241863606037740000"}`;
  const myRequest = {
    url: url,
    method: method,
    headers: headers,
    body: body,
  };
  post(myRequest, cb);
}

function nobyda() {
  const start = Date.now();
  // 判断是否是重写
  const isRequest = typeof $request != 'undefined';
  // 判断是否是Surge
  const isSurge = typeof $httpClient != 'undefined';
  // 判断是否是QuanX
  const isQuanX = typeof $task != 'undefined';
  // 判断是否是Loon
  const isLoon = typeof $loon != 'undefined';
  // 判断是否是JSBox
  const isJSBox = typeof $app != 'undefined' && typeof $http != 'undefined';
  // 判断是否是Node环境
  const isNode = typeof require == 'function' && !isJSBox;
  const NodeSet = 'CookieSet.json';
  /**
   * 引入Nodejs中的request模块和fs模块
   * @type {{request: *, fs: module:fs}|null}
   */
  const node = (() => {
    if (isNode) {
      const request = require('request');
      const fs = require('fs');
      return {
        request,
        fs,
      };
    } else {
      return null;
    }
  })();
  /**
   * 提示信息
   * @param {string} title 标题
   * @param {string} subtitle 副标题
   * @param {string} message 提示信息
   * @param {*} rawopts 设置
   */
  const notify = (title, subtitle, message, rawopts) => {
    const Opts = (rawopts) => {
      //Modified from https://github.com/chavyleung/scripts/blob/master/Env.js
      if (!rawopts) return rawopts;
      switch (typeof rawopts) {
        case 'string':
          return isLoon
            ? rawopts
            : isQuanX
            ? {
                'open-url': rawopts,
              }
            : isSurge
            ? {
                url: rawopts,
              }
            : undefined;
        case 'object':
          if (isLoon) {
            let openUrl = rawopts.openUrl || rawopts.url || rawopts['open-url'];
            let mediaUrl = rawopts.mediaUrl || rawopts['media-url'];
            return {
              openUrl,
              mediaUrl,
            };
          } else if (isQuanX) {
            let openUrl = rawopts['open-url'] || rawopts.url || rawopts.openUrl;
            let mediaUrl = rawopts['media-url'] || rawopts.mediaUrl;
            return {
              'open-url': openUrl,
              'media-url': mediaUrl,
            };
          } else if (isSurge) {
            let openUrl = rawopts.url || rawopts.openUrl || rawopts['open-url'];
            return {
              url: openUrl,
            };
          }
          break;
        default:
          return undefined;
      }
    };
    console.log(`${title}\n${subtitle}\n${message}`);
    if (isQuanX) $notify(title, subtitle, message, Opts(rawopts));
    if (isSurge) $notification.post(title, subtitle, message, Opts(rawopts));
    if (isJSBox)
      $push.schedule({
        title: title,
        body: subtitle ? subtitle + '\n' + message : message,
      });
  };
  // 将获得的cookies信息储存起来
  const write = (value, key) => {
    if (isQuanX) return $prefs.setValueForKey(value, key);
    if (isSurge) return $persistentStore.write(value, key);
    if (isNode) {
      try {
        if (!node.fs.existsSync(NodeSet))
          node.fs.writeFileSync(NodeSet, JSON.stringify({}));
        const dataValue = JSON.parse(node.fs.readFileSync(NodeSet));
        if (value) dataValue[key] = value;
        if (!value) delete dataValue[key];
        return node.fs.writeFileSync(NodeSet, JSON.stringify(dataValue));
      } catch (er) {
        return AnError('Node.js持久化写入', null, er);
      }
    }
    if (isJSBox) {
      if (!value) return $file.delete(`shared://${key}.txt`);
      return $file.write({
        data: $data({
          string: value,
        }),
        path: `shared://${key}.txt`,
      });
    }
  };
  // 将获取的cookies信息读出来
  const read = (key) => {
    if (isQuanX) return $prefs.valueForKey(key);
    if (isSurge) return $persistentStore.read(key);
    if (isNode) {
      try {
        if (!node.fs.existsSync(NodeSet)) return null;
        const dataValue = JSON.parse(node.fs.readFileSync(NodeSet));
        return dataValue[key];
      } catch (er) {
        return AnError('Node.js持久化读取', null, er);
      }
    }
    if (isJSBox) {
      if (!$file.exists(`shared://${key}.txt`)) return null;
      return $file.read(`shared://${key}.txt`).string;
    }
  };
  const adapterStatus = (response) => {
    if (response) {
      if (response.status) {
        response['statusCode'] = response.status;
      } else if (response.statusCode) {
        response['status'] = response.statusCode;
      }
    }
    return response;
  };
  // get请求
  const get = (options, callback) => {
    if (isQuanX) {
      $task.fetch(options).then(
        (response) => {
          callback(null, adapterStatus(response), response.body);
        },
        (reason) => callback(reason.error, null, null)
      );
    }
    if (isSurge) {
      options.headers['X-Surge-Skip-Scripting'] = false;
      $httpClient.get(options, (error, response, body) => {
        callback(error, adapterStatus(response), body);
      });
    }
    if (isNode) {
      node.request(options, (error, response, body) => {
        callback(error, adapterStatus(response), body);
      });
    }
    if (isJSBox) {
      if (typeof options == 'string')
        options = {
          url: options,
        };
      options['header'] = options['headers'];
      options['handler'] = function (resp) {
        let error = resp.error;
        if (error) error = JSON.stringify(resp.error);
        let body = resp.data;
        if (typeof body == 'object') body = JSON.stringify(resp.data);
        callback(error, adapterStatus(resp.response), body);
      };
      $http.get(options);
    }
  };
  // post请求
  const post = (options, callback) => {
    if (isQuanX) {
      $task.fetch(options).then(
        (response) => {
          callback(null, adapterStatus(response), response.body);
        },
        (reason) => callback(reason.error, null, null)
      );
    }
    if (isSurge) {
      options.headers['X-Surge-Skip-Scripting'] = false;
      $httpClient.post(options, (error, response, body) => {
        callback(error, adapterStatus(response), body);
      });
    }
    if (isNode) {
      node.request.post(options, (error, response, body) => {
        callback(error, adapterStatus(response), body);
      });
    }
    if (isJSBox) {
      if (typeof options == 'string')
        options = {
          url: options,
        };
      options['header'] = options['headers'];
      options['handler'] = function (resp) {
        let error = resp.error;
        if (error) error = JSON.stringify(resp.error);
        let body = resp.data;
        if (typeof body == 'object') body = JSON.stringify(resp.data);
        callback(error, adapterStatus(resp.response), body);
      };
      $http.post(options);
    }
  };
  // 异常信息
  const AnError = (name, keyname, er, resp, body) => {
    if (typeof merge != 'undefined' && keyname) {
      if (!merge[keyname].notify) {
        merge[keyname].notify = `${name}: 异常, 已输出日志 ‼️`;
      } else {
        merge[keyname].notify += `\n${name}: 异常, 已输出日志 ‼️ (2)`;
      }
      merge[keyname].error = 1;
    }
    return console.log(
      `\n‼️${name}发生错误\n‼️名称: ${er.name}\n‼️描述: ${er.message}${
        JSON.stringify(er).match(/"line"/)
          ? `\n‼️行列: ${JSON.stringify(er)}`
          : ``
      }${resp && resp.status ? `\n‼️状态: ${resp.status}` : ``}${
        body ? `\n‼️响应: ${resp && resp.status != 503 ? body : `Omit.`}` : ``
      }`
    );
  };
  // 总共用时
  const time = () => {
    const end = ((Date.now() - start) / 1000).toFixed(2);
    return console.log('\n签到用时: ' + end + ' 秒');
  };
  // 关闭请求
  const done = (value = {}) => {
    if (isQuanX) return $done(value);
    if (isSurge) isRequest ? $done(value) : $done();
  };
  return {
    AnError,
    isRequest,
    isJSBox,
    isSurge,
    isQuanX,
    isLoon,
    isNode,
    notify,
    write,
    read,
    get,
    post,
    time,
    done,
  };
}

if (typeof $request != 'undefined') {
  const headers = JSON.stringify($request.headers);
  write(headers, 'longfor');
  notify('龙湖', '', 'Cookie获取成功');
  done();
} else {
  const headers = JSON.parse(read('longfor'));
  Start(headers);
}
