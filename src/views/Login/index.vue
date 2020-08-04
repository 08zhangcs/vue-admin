<template>
  <div id="login">
    <div class="login-wrap">
      <ul class="menu-tab">
        <li
          :class="{'current': item.current}"
          v-for="(item, index) in menuTab"
          :key="index"
          @click="toggleMenu(item)"
        >{{item.txt}}</li>
      </ul>
      <!-- 表单 -->
      <el-form
        :model="ruleForm"
        status-icon
        :rules="rules"
        ref="loginForm"
        class="login-form"
        size="medium"
      >
        <el-form-item prop="username" class="item-form">
          <label for="username">邮箱</label>
          <el-input id="username" type="text" v-model="ruleForm.username" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="password" class="item-form">
          <label for="password">密码</label>
          <el-input
            id="password"
            type="password"
            v-model="ruleForm.password"
            autocomplete="off"
            minlength="6"
            maxlength="20"
          ></el-input>
        </el-form-item>
        <el-form-item prop="passwords" class="item-form" v-show="model === 'register'">
          <label for="passwords">重复密码</label>
          <el-input
            id="passwords"
            type="password"
            v-model="ruleForm.passwords"
            autocomplete="off"
            minlength="6"
            maxlength="20"
          ></el-input>
        </el-form-item>
        <el-form-item prop="code" class="item-form">
          <label for="code">验证码</label>
          <el-row :gutter="10">
            <el-col :span="15">
              <el-input id="code" v-model="ruleForm.code" minlength="6" maxlength="6"></el-input>
            </el-col>
            <el-col :span="9">
              <el-button
                type="success"
                class="block"
                @click="getSms()"
                :disabled="codeButtonStatus.status"
              >{{codeButtonStatus.text}}</el-button>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-button
            type="danger"
            @click="submitForm('loginForm')"
            class="login-btn block"
            :disabled="loginButtonStatus"
          >{{model === "login" ? "登录" : "注册"}}</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import sha1 from "js-sha1";
import { GetSms, Rsgister, Login } from "@/api/login";
import { reactive, ref, isRef, toRefs, onMounted } from "@vue/composition-api";
import {
  stripscript,
  validateEmail,
  validatePass,
  validateVcode
} from "@/utils/validate";

export default {
  name: "login",
  //   setup(props, context) {
  // attrs: (...) = this.$attrs
  // emit: (...) = this.$emit
  // listener: (...) = this.$listener
  // parent: (...) = this.$parent
  // refs: (...) = this.$refs
  // root: (...) = this.$root
  setup(props, { refs, root }) {
    // 邮箱验证
    let validateUsername = (rule, value, callback) => {
      if (value === "") {
        callback(new Error("请输入用户名"));
      } else if (validateEmail(value)) {
        callback(new Error("用户名格式不正确"));
      } else {
        callback();
      }
    };
    // 密码验证
    let validatePassword = (rule, value, callback) => {
      // 密码过滤特殊字符之后的内容
      ruleForm.password = stripscript(value);
      value = ruleForm.password;
      if (value === "") {
        callback(new Error("请输入密码"));
      } else if (validatePass(value)) {
        callback(new Error("密码为6至20位的数字+字母表"));
      } else {
        callback();
      }
    };
    // 重复密码验证
    let validatePasswords = (rule, value, callback) => {
      //  如果模块值为login， 直接通过
      if (model.value === "login") {
        callback();
      }
      // 密码过滤特殊字符之后的内容
      ruleForm.passwords = stripscript(value);
      value = ruleForm.passwords;
      if (value === "") {
        callback(new Error("请再次输入密码"));
      } else if (value != ruleForm.password) {
        callback(new Error("重复密码不正确"));
      } else {
        callback();
      }
    };
    // 验证码验证
    let validateCode = (rule, value, callback) => {
      if (value === "") {
        return callback(new Error("输入验证码"));
      } else if (validateVcode(value)) {
        callback(new Error("验证码错误"));
      } else {
        callback();
      }
    };

    /**************************************************************************************************************/

    //  这里是放置data数据，生命周期， 自定义 的函数
    const menuTab = reactive([
      { txt: "登录", current: true, type: "login" },
      { txt: "注册", current: false, type: "register" }
    ]);

    //  模块值
    const model = ref("login");
    // console.log(model.value)  ref获取 reactive 的值时必须要有value值
    // 提交按钮状态
    const loginButtonStatus = ref(true);
    // 验证码按钮状态
    const codeButtonStatus = reactive({
      status: false,
      text: "获取验证码"
    });
    // 倒计时
    const timer = ref(null);
    // 表单绑定数据
    const ruleForm = reactive({
      username: "",
      password: "",
      passwords: "",
      code: ""
    });
    // 表单验证
    const rules = reactive({
      username: [{ validator: validateUsername, trigger: "blur" }],
      password: [{ validator: validatePassword, trigger: "blur" }],
      passwords: [{ validator: validatePasswords, trigger: "blur" }],
      code: [{ validator: validateCode, trigger: "blur" }]
    });

    /* 声明函数 */
    const toggleMenu = data => {
      menuTab.forEach((elem, index) => {
        elem.current = false;
      });
      // 高光
      data.current = true;
      // 修改模块值
      model.value = data.type;
      //   
      resetFormData()
      clearCountDown()
    };
    // 清除变单数据
    const resetFormData = (()=>{
      // this.$refs[formName].resetFields();  2.0
      // 表单重置
      refs.loginForm.resetFields();
    });
    
    // 跟新按钮状态
    const updataButtonStatus = ((params)=>{
      codeButtonStatus.status = params.status;
      codeButtonStatus.text = params.text;
    });
    // 获取验证码
    const getSms = () => {
      // 进行提示
      if (ruleForm.username === "") {
        root.$message.error("邮箱不能为空！！");
        return false;
      }
      if (validateEmail(ruleForm.username)) {
        root.$message.error("邮箱格式有误，请重新输入！！");
        return false;
      }
      // 获取验证码
      let requestData = {
        username: ruleForm.username,
        module: model.value
      };
      //  修改获取验证码按钮状态
      // codeButtonStatus.status = true;
      // codeButtonStatus.text = "发送中";
      updataButtonStatus({
        status: true,
        text: "发送中"
      });

      // 延时时间
      GetSms(requestData)
        .then(response => {
          let data = response.data;
          root.$message({
            showClose: true,
            message: "验证码已发送",
            // message: data.message,
            type: "success"
          });
          loginButtonStatus.value = false;
          countDown(10);
          console.log(data);
        })
        .catch(error => {
          console.log(error);
        });
    };
    // 提交表单
    const submitForm = formName => {
      refs[formName].validate(valid => {
        if (valid) {
          model.value === "login" ? login() : segister();
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    };
    //  登录
    const login = () => {
      let requestData = {
        username: ruleForm.username,
        password: sha1(ruleForm.password),
        code: ruleForm.code
        // module: 'login'
      };
      Login(requestData)
        .then(response => {
          console.log("登录成功");
        })
        .catch(error => {
          console.log(error);
        });
    };
    //注册
    const segister = () => {
      let requestData = {
        username: ruleForm.username,
        password: sha1(ruleForm.password),
        code: ruleForm.code,
        module: "register"
      };
      Rsgister(requestData)
        .then(response => {
          let data = response.data;
          root.$message({
            message: data.message,
            type: "success"
          });
          //  模拟注册成功
          toggleMenu(menuTab[0]);
          clearCountDown();
        })
        .catch(error => {
          console.log(error);
        });
    };
    //  倒计时
    const countDown = number => {
      // 判断定时器是否存在，存在则清除
      if (timer.value) {
        clearInterval(timer.value);

      }
      let time = number;
      timer.value = setInterval(() => {
        time--;
        console.log(time);
        if (time === 0) {
          clearInterval(timer.value);
          updataButtonStatus({
            status: false,
            text: "重新发送"
          });
        } else {
          codeButtonStatus.text = `倒计时${time}秒`;
        }
      }, 1000);
    };

    //  清除倒计时
    const clearCountDown = () => {
      //  还原验证码按钮的默认状态
      updataButtonStatus({
            status: false,
            text: "获取验证码"
      });
      //清除倒计时
      clearInterval(timer.value);
    };

    /* 生命周期 */
    onMounted(() => {
      // GetSms()
    });

    return {
      menuTab,
      model,
      toggleMenu,
      submitForm,
      ruleForm,
      rules,
      getSms,
      loginButtonStatus,
      codeButtonStatus
    };
  }
};
</script>

<style lang="scss" scoped>
#login {
  height: 100vh;
  background-color: #344a5f;
}
.login-wrap {
  width: 330px;
  margin: auto;
}
.menu-tab {
  text-align: center;
  li {
    display: inline-block;
    width: 88px;
    line-height: 36px;
    font-size: 14px;
    color: #fff;
    border-radius: 2px;
    cursor: pointer;
  }
  .current {
    background-color: rgba(0, 0, 0, 0.1);
  }
}
.login-form {
  margin-top: 29px;
  label {
    margin-bottom: 3px;
    font-size: 14px;
    color: #fff;
    display: block;
  }
  .item-form {
    margin-bottom: 13px;
  }
  .block {
    display: block;
    width: 100%;
  }
  .login-btn {
    margin-top: 29px;
  }
}
</style>