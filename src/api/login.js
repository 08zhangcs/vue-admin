import service from "@/utils/request";
// service 名字可以改动
// 获取验证码接口
export function GetSms(data) {
  return service.request({
    method: "post",
    url: "/getSms/",
    data
  });
}
// 获取用户名
// 登录
export function Login(data) {
  return service.request({
    method: "post",
    url: "/login/",
    data
  });
}
// 注册
export function Rsgister(data) {
  return service.request({
    method: "post",
    url: "/register/",
    data
  });
}
