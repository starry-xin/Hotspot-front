// pages/order/order.js
import Toast from '@vant/weapp/toast/toast';

var util = require('../../utils/util.js');
var app = getApp();

//需要从主页load获得global.data

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userId:'-1',
    curOrder: Object,
    date: '2020-08-01',
    startDate : '2020-08-01',//used to set the start time of picker
    //spotOrderTimeList
    listData : [
      // order_status: 0 stands for can not be ordered, 1 stands for can be ordered
      //user_order_status: 0 stands for haven't not been ordered, 1 stands for have been ordered
      //time_status: 0 stands for currentTime < selectedTime; 1 stands for currentTime >= selectedTime (consider date)
      {order_time: "08:00 - 10:00", order_status: "1", time_status : "0", user_order_status: "0", orderRatio:""},
      {order_time: "10:00 - 12:00", order_status: "1", time_status : "0", user_order_status: "0", orderRatio:""},
      {order_time: "14:00 - 16:00", order_status: "1",time_status : "0", user_order_status: "0", orderRatio:""},
      {order_time: "16:00 - 18:00", order_status: "1",time_status : "0", user_order_status: "0", orderRatio:""},
      {order_time: "18:00 - 20:00", order_status: "1",time_status : "0", user_order_status: "0", orderRatio:""},
      {order_time: "20:00 - 22:00", order_status: "1",time_status : "0", user_order_status: "0", orderRatio:""}
    ],
    user_order_status_index:"9999",//at most one listData[index].user_order_status = 1 is permitted
    button_word:["预约","取消"],
    placeIndex: '0',//spotId
    placeArray:["南京大学游泳馆","方肇周体育馆","田径场","学生第四餐厅","学生第五餐厅","四组团餐厅" , "杜厦图书馆"],//get spotName
    spotOrderTimeList: [],//correpsonding orderlist for the chosen spot
    spotWishTimeList: [],
    submit_type : "预约",//
    btn_img : "clock",
    placeType: '0',
    isModify: false,
    btn_color: app.globalData.color_info,
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //test /spot/listAllSpots
    var that = this;

    //jump from callout
    if(options.orderBean != null){
      var orderBean = JSON.parse(options.orderBean);
        console.log(orderBean);
        that.setData({
          placeIndex : orderBean,
        })
    }
    // console.log(options.orderItem)
    //jump from mine.js page
    if (options.orderItem != null){
      var curOrder = JSON.parse(options.orderItem);
      console.log("curOrder");
      console.log(curOrder);
      
      that.setData({
        curOrder: curOrder,
        userId: options.userId,
        submit_type: "修改",
        isModify: true,
        date: curOrder.orderDate,
      })
      console.log(that.data.submit_type)
    }
    
    //set date to the current date & check current time
    if (options.orderItem == null)
        that.setDate();//it is only used when onLoad
    that.setStartDate();
    
    // set placeArray
    var spotList = app.globalData.spotList;
    console.log("spotList")
    console.log(spotList)
    if(spotList.length > 0){
      console.log("test test");
      //use global data spotList attained from the index.js
      var tmpPlaceArray = new Array(spotList.length);
      //place[spotId] = spotName, but not place[i] = spotName
      //because the value returned by placepicker is index
      for(var i = 0; i < spotList.length; ++i){
        tmpPlaceArray[spotList[i].spotId - 1] =  spotList[i].spotName;
      }
      that.setData({
        placeArray : tmpPlaceArray,
      })
    }

    that.getSpotTime();

  },
  onShow: function(){
    console.log("onshow--------")
    if (this.data.userId != '-1'){
      this.setData({
        submit_type: "修改"
      })
    }
  },
  //when date picker is selected
  //to be done
  bindDateChange: function(e) {
    this.setData({
      date: e.detail.value,
      user_order_status_index: 9999
    })
    console.log('date picker发送选择改变', this.data.date);
    //load the available time
    this.getSpotTime();
  },

  bindPlaceChange: function(e) {
    var that = this;
    console.log('place picker发送选择改变，携带值为', e.detail)
    that.setData({
      placeIndex: e.detail.value, //start from 0
      user_order_status_index: 9999
    })
    //load the available time
    that.getSpotTime();
  },

  //get listSpotOrderTime
  // the spot is whethr an order-spot, or a wish-spot
  getSpotTime: function (){
    var that = this;

    //get type of spot
    console.log("spotlist");
    console.log(app.globalData.spotList);

    let spotList = app.globalData.spotList;
    let spotIndex = that.getIndexById(Number(this.data.placeIndex) + 1);//id start from 1
    let spotType = that.getSpotTypeById(Number(this.data.placeIndex) + 1);
    that.setData({
      placeType: spotType
    })
   
    if(spotType == '1'){
      //order
      console.log("order spot");
      console.log(app.globalData.spotList[spotIndex].spotName);
      that.getSpotOrderTime();

      let submit_text  = "预约";
      if(that.data.isModify)
        submit_text = "修改";
      that.setData({
        submit_type : submit_text,
        btn_img : "clock",
        btn_color: app.globalData.color_info
      })
    }else{
      //wish
      console.log("wish spot");
      console.log(app.globalData.spotList[spotIndex].spotName);
      that.getSpotWishTime();

      let submit_text  = "想去";
      if(that.data.isModify)
        submit_text = "修改";
      that.setData({
        submit_type : submit_text,
        btn_img : "like",
        btn_color: app.globalData.color_wish
      })
    }
  },

  getSpotOrderTime : function(e){
    var that = this;
    var UrlplaceIndex = Number(that.data.placeIndex) + 1;
    //load the available time
    wx.request({
      //placeIndex + 1 because the major key in database start from index = 1
      url: app.globalData.url + "/order/listSpotOrderTime?date="+that.data.date+"&spotId=" + UrlplaceIndex,
      method: 'GET',
      success: (res) =>{
          //using spotOrderTimeList to update listData
          let tmplistData = [];
          for(let i = 0; i < res.data.length; i++) {
            // check ordered people
            let order_status = 0;
            if(res.data[i].orderedPeople < res.data[i].suggestedPeople)
              order_status = 1;

            let time_status = that.getTimeStatus(res.data[i]);
            let curr = {
              order_time: res.data[i].startTime + " - " + res.data[i].endTime, 
              order_status: order_status, 
              time_status : time_status, 
              user_order_status: 0,
              orderRatio: "剩余:" + (Number(res.data[i].suggestedPeople) - Number(res.data[i].orderedPeople)),
            };
            tmplistData.push(curr);

          }
          that.setData({
            listData : tmplistData,
            spotOrderTimeList : res.data
          });
          console.log("listData");
          console.log(that.data.listData);
      }
    })
  },
  
  getSpotWishTime : function(e){
    var that = this;
    var UrlplaceIndex = Number(that.data.placeIndex) + 1;
    //load the available time
    wx.request({
      //placeIndex + 1 because the major key in database start from index = 1
      url: app.globalData.url + "/wish/listSpotWishTime?date=" + that.data.date + "&spotId=" + UrlplaceIndex,
      method: 'GET',
      success: (res) =>{
          //using spotOrderTimeList to update listData
          let tmplistData = [];
          for(let i = 0; i < res.data.length; i++) {

            let time_status = that.getTimeStatus(res.data[i]);
            let curr = {
              order_time: res.data[i].startTime + " - " + res.data[i].endTime, 
              order_status: 1, 
              time_status : time_status, 
              user_order_status: 0,
              orderRatio: "想去:" + Number(res.data[i].wishedPeople) +'/' + Number(res.data[i].suggestedPeople),
            };
            tmplistData.push(curr);

          }
          that.setData({
            listData : tmplistData,
            spotWishTimeList : res.data //re-use the struct for OrderSpot
          });
          console.log("spotWishTimeList");
          console.log(that.data.spotWishTimeList);
      }
    })
  },

  getIndexById : function(id){
    console.log("id "+ id);
    var index = -1;
    var spotList = app.globalData.spotList;
    for(let i = 0; i < spotList.length; ++i){
      if(spotList[i].spotId == id){
        index = i;
      }
    }
    return index;
  },

  getSpotTypeById : function(id){
    let spotType = 0;
    let spotList = app.globalData.spotList;
    let spotIndex = this.getIndexById(id);//id start from 1
    if(spotIndex != -1){
      console.log("spotIndex " + spotIndex);
       spotType = spotList[spotIndex].spotType;
    }else {
      console.error("cannot find corresponding index");
    }

    return spotType;
  },

  getTimeStatus : function(selected){
      var that = this;
      let time_status = 0;
      let currentDateTime = util.formatTime(new Date());
      let hour = selected.endTime;
      let currentDate = currentDateTime.split(' ')[0];
      let currentTime = currentDateTime.split(' ')[1];
      if(that.data.date == currentDate){
          let selectedTime = [hour, 0].map(util.formatNumber).join(':');
          if(currentTime >= selectedTime){
            time_status = 1;//can not choose
          }
      }else if(that.data.date < currentDate){//this normally won't happen as start time of datePicker is aleady set
          time_status = 1;
      }else{
        time_status = 0;//selectedDate > currentDate
      }
      return time_status;
  },

  //to be done
  onclickorder1: function(e){
    console.log(e);
    //跟后端交互 to be done & 图标变成: 取消预约
    let value = e.currentTarget.dataset.value;
    console.log("value "+value);
    //toggle the state of user_order_status, 0 ^ 1 -> 1, 1 ^ 1 -> 0
    console.log(this.data.listData);

    let tmplistdata = this.data.listData;
    //cancel the last selected user_oder_status = 0 (at most one item can be selected)
    if(this.data.user_order_status_index != "9999"){ 
      tmplistdata[this.data.user_order_status_index].user_order_status = 0;
    }

    //change the user_order_status of the current item to 1
    //if last_index != current_index, -> 1, 
    //otherwise, -> 0 (already set in  if(this.data.user_order_status_index != "9999"))
    if(this.data.user_order_status_index != value){
      tmplistdata[value].user_order_status = tmplistdata[value].user_order_status ^ 1;
      console.log("set value: " + this.data.user_order_status_index);
    }

    if(tmplistdata[value].user_order_status == 0){
      this.data.user_order_status_index = "9999";
    } else{
      this.data.user_order_status_index = value;
    }
  
    //setData cannot get list item directly
    //this.setData should be used to reload the changed data
    this.setData({
       listData : tmplistdata,
    });

    console.log(this.data.listData[value].user_order_status);
    

    // if(listdata[value].user_order_status == "1"){
    //   wx.showToast({
    //     icon: 'none',
    //     title: '预约成功！可在个人中心查看:)',
    //   })
    // }else{
    //   wx.showToast({
    //     icon: 'none',
    //     title: '取消预约，涉及个人信用，请谨慎操作:(',
    //   })
    // }
   
  },
  onclickorder2: function(e){
    let value = e.currentTarget.dataset.value;
    let toastText = '';
    if(this.data.listData[value].order_status == '0')
      toastText = '此时段预约已满:(';
    else
      toastText = '此时段不可预约:(';
    wx.showToast({
      title: toastText,
      icon: 'none'
    })
  },

  //to be done, submit order
  onclicksubmit: function(e){
      let that = this;
      if (that.data.userId == -1)
        //check login state
        that.checkLogin();
      else{
        var userInfo = wx.getStorageSync('userinfo');
          console.log("userinfo");
          console.log(userInfo);
          if(that.getSpotTypeById(Number(this.data.placeIndex) + 1) == "0")
            that.submitWish();
          else
           that.submitOrder();//submit after get userid
      }
  },

  onclickinfo : function(e){
    let that = this;
    let spotType = that.data.placeType;
    let spotId = Number(that.data.placeIndex) + 1;//spotId
    wx.navigateTo({
      url: '/pages/history/history?spotId='+spotId+'&spotType='+spotType,
    })
  },

  //SET DATE
  setDate : function(){
    var that = this;
    var time = util.formatTime(new Date());
    var arr = time.split(" ");
    that.setData({
      date : arr[0],
    });
  },

  //set start date
  setStartDate : function(){
    var that = this;
    var time = util.formatTime(new Date());
    var arr = time.split(" ");
    that.setData({
      startDate : arr[0],
    });
  },

  //check login state
  checkLogin : function(e){

    var that = this;
    var userInfo = wx.getStorageSync('userinfo');
    console.log("userinfo");
    console.log(userInfo);

    //the user has not logined 
    if(userInfo.length == 0){
      // let naviBean = JSON.stringify(1);
      app.globalData.naviBean = 1;//indicate that this is the jump from order page
      wx.switchTab({
        // url: '/pages/index/mine?naviBean='+naviBean,
        url: '/pages/index/mine',
        complete: (res) =>{
          console.log("complete");
        }
      })
    }else {
      // that.getUserIdByName();
      console.log("userId");
      console.log(app.globalData.userId);
      if(app.globalData.userId == '0'){
        //UserId doesn't get successfully
        that.getUserIdByName();

      }else {
        console.log("SpotType "+ that.getSpotTypeById(Number(this.data.placeIndex) + 1));
        if(that.getSpotTypeById(Number(this.data.placeIndex) + 1) == "0")
          that.submitWish();
        else
          that.submitOrder();//submit after get userid
      }
      }
  },

  submitWish : function(e){
    var that = this;
    if(that.data.user_order_status_index != "9999"){

     //get start time and end time from 
     let dur = that.data.listData[that.data.user_order_status_index].order_time;
     let arr = dur.split(" - ");
     console.log("arr "+ arr);

     wx.request({
       url: app.globalData.url + "/wish/addWish",//addOrder to be done
       method: 'POST',
       data: {
         "wishDate": that.data.date,
         "userId": app.globalData.userId,
         "wishTime": {
          "spotId": Number(that.data.placeIndex) + 1,
          "spotWishTimeId": that.data.spotWishTimeList[that.data.user_order_status_index].spotWishTimeId,
        },
       },
       headers:{
         'content-type': 'application/json' // 默认值 
       },

       success(res){
         console.log("res.data");
         console.log(res.data);
         console.log(res.data.success);
         console.log("spotOrderTimeId "+ that.data.spotWishTimeList[that.data.user_order_status_index].spotWishTimeId);
         console.log("spotId ");
         console.log(Number(that.data.placeIndex) + 1);
         console.log("userId " +app.globalData.userId);
         if(res.data.success == false){
           // var toastText = "预约失败:(" + res.data.errMsg;
           var toastText = "失败:(";
           //analysis errMsg
           if(res.data.errMsg.indexOf("Duplicate") != -1)
             toastText = toastText + "\n您已“想去”该时段，请前往个人中心查看";

           Toast.fail(toastText);
         } else {
            if (that.data.userId==-1){
              var toastText = "成功:)";
              Toast.success(toastText);
              setTimeout(function(){
                wx.navigateBack({
                  complete: (res) => {},
                })
              },2000);
            }
            else{
              that.cancelCurWish();
            }
         }
        }
     })
   } else {
     var toastText = "请选择时段";
     Toast.fail(toastText);
   };
  },

  submitOrder : function(e){
    console.log("enter submitOrder");
    //if time is selected (valid), send request
    var that = this;
    console.log("user_order_status_index " + that.data.user_order_status_index );
    if(that.data.user_order_status_index != "9999"){
      //get start time and end time from 
      let dur = that.data.listData[that.data.user_order_status_index].order_time;
      let arr = dur.split(" - ");
      console.log("arr "+ arr);

      let orderUrlPara = "/order/addOrder";
      let currentDate = util.formatTime(new Date()).split(' ')[0];
      if(that.data.date == currentDate)//should use FIFO as the order date = today
        orderUrlPara = "/order/addFIFOOrder";
      wx.request({
        url: app.globalData.url + orderUrlPara,//addOrder to be done
        method: 'POST',
        data: {
          "orderDate": that.data.date,
          "userId": app.globalData.userId,//to be done
          "orderTime":{
            "spotOrderTimeId": that.data.spotOrderTimeList[that.data.user_order_status_index].spotOrderTimeId
          }
        },
        headers:{
          'content-type': 'application/json' // 默认值 
        },

      success(res){
        console.log("res.data");
        console.log(res.data);
        console.log(res.data.success);
        console.log("spotOrderTimeId "+ that.data.spotOrderTimeList[that.data.user_order_status_index].spotOrderTimeId);
        if(res.data.success == false){
          var toastText = "预约失败:(";
          //analysis errMsg
          if(res.data.errMsg.indexOf("Duplicate") != -1)
            toastText = toastText + "\n已预约该时段";
          Toast.fail(toastText);
        } else {
          if(that.data.userId==-1){
            var toastText = "预约成功:)";
            if(that.data.date != currentDate)
              toastText = "成功！预约正在审核中:)"
            Toast.success(toastText);
            setTimeout(function(){
              wx.navigateBack({
                complete: (res) => {},
              })
            },2000);
          }
          else{
            that.cancelCurOrder(); 
          }
        }
        }
    })
  } else {
    var toastText = "请选择时段";
    Toast.fail(toastText);
  };
  },
  cancelCurOrder : function (){
    var that = this;
    let orderId = that.data.curOrder.orderId;
    console.log("orderId "+ orderId);
    wx.request({
      url: app.globalData.url + "/order/deleteOrder?orderId="+orderId,
      method: 'DELETE',
      headers:{
        'content-type': 'application/json' // 默认值 
      },
      success(res){
        console.log("res.data");
        console.log(res.data);
        console.log(res.data.errMsg)
        if(res.data.success == false){
          var toastText = "修改失败:(";
          Toast.fail(toastText);
        } else {
          var toastText = "修改成功:)";
          Toast.success(toastText);
          setTimeout(function(){
            wx.navigateBack({
              complete: (res) => {},
            })
          },1000);
        }
       }
    })
  },

  cancelCurWish : function (){
    var that = this;
    let wishId = that.data.curOrder.wishId;
    console.log("wishid "+ wishId);
    wx.request({
      url: app.globalData.url + "/wish/cancelWish?wishId="+wishId,
      method: 'POST',
      headers:{
        'content-type': 'application/json' // 默认值 
      },
      success(res){
        console.log(res);
        console.log(res.data);
        if(res.data == false){
          var toastText = "2222修改失败:(";
          Toast.fail(toastText);
        } else {
          console.log("suceedddddd!!!!!")
          var toastText = "修改成功:)";
          Toast.success(toastText);
          setTimeout(function(){
            wx.navigateBack({
              complete: (res) => {},
            })
          },1000);
        }
       }
    })
  },

  getUserIdByName : function(e){
    //get user id
    var that = this;
    if(app.globalData.userId == '0'){
      var userinfo = wx.getStorageSync("userinfo");
      if(userinfo.length == 0) {
        Toast.fail("获取用户信息失败！");
      }else{
          let re=/[^\u4e00-\u9fa5a-zA-Z0-9]/g;
          let nickName = userinfo.nickName.replace(re, "");
          wx.request({
            url: app.globalData.url + "/user/findUserByName?userName="+ nickName,//to be modified
            method: 'GET',
            success: (res) =>{
                if(res.data.length == 0){
                  Toast.fail("获取用户信息失败！");
                }else {
                  console.log("getUserIdByName res.data");
                  console.log(res.data);
                  app.globalData.userId = res.data.userId;

                  if(that.getSpotTypeById(Number(this.data.placeIndex) + 1) == "0")
                      that.submitWish();
                  else
                      that.submitOrder();//submit after get userid
                }
            }
        });
      }
  }
}

})





// Component({

// })