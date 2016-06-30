
'use strict';

define(['app'], function (app) {
	
	var userInfoSAController = function ($rootScope, $route, $routeParams,   $scope, $timeout, userService, 
		localStorageService, configurationService, messageService, constantService, duplicateValidationService, 
		comboService, ngProgress, navigationService, loadService) {
		
		
		var loginInfo;
		$scope.user = {};
		$scope.btn_save_up = "btn_Save";
		$scope.isFieldDisabled = {loginId : false,
								  password : false,
								  bankID : true};
		$scope.isBlockShow = {
				resetButton 	: true,
				password 		: true};
		$scope.title = {value: "CreateUser"};
		
		$scope.roleInfos = [{ id: "Admin", value: "Admin" }];
		$scope.statusInfos = [{ id: "A", value: "Active" },
		                      { id: "I", value: "Inactive" }];
		
		var fieldValidationInit = function(){
			$scope.passFieldValidationResult = {fieldMsg : 'BLANK'};
			$scope.confirmPassFieldValidationResult = {fieldMsg : 'BLANK'};
		};
		
		var initInputFieldValidationResult = function(field, changeOrBlur){			
			
			if(field === $scope.passFieldValidationResult)
			{
				fieldValidationInit();
				$scope.passFieldValidationResult = constantService.fieldValidationResult;
				
				$scope.passFieldValidationResult.fieldObj = $scope.user.password;
				$scope.passFieldValidationResult.fieldID = "#InputPassword";
				$scope.passFieldValidationResult.fieldType = constantService.inputFieldType.PASSWORD;
				$scope.passFieldValidationResult.changeORblur = changeOrBlur;
				$scope.passFieldValidationResult.mandatory = true;
				
				$scope.passFieldValidationResult = constantService.isValidField($scope.passFieldValidationResult);
			}
			else if(field === $scope.confirmPassFieldValidationResult)
			{
				fieldValidationInit();
				$scope.confirmPassFieldValidationResult = constantService.fieldValidationResult;
				
				$scope.confirmPassFieldValidationResult.fieldObj = $scope.user.confirmPassword;
				$scope.confirmPassFieldValidationResult.fieldID = "#inputConfirmPassword";
				$scope.confirmPassFieldValidationResult.compareObj = $scope.user.password;
				$scope.confirmPassFieldValidationResult.compareFieldID = "#InputPassword";
				$scope.confirmPassFieldValidationResult.fieldType = constantService.inputFieldType.CONFIRM_PASSWORD;
				$scope.confirmPassFieldValidationResult.changeORblur = changeOrBlur;
				$scope.confirmPassFieldValidationResult.mandatory = true;
				
				$scope.confirmPassFieldValidationResult = constantService.isValidField($scope.confirmPassFieldValidationResult);
			}
			
		};
		
		$scope.changeInputField = function(field){
			
			var changeOrBlur = constantService.inputFieldAction.CHANGE;			
			initInputFieldValidationResult(field, changeOrBlur);
		};
		
		$scope.leaveInputField = function(field){
			
			var changeOrBlur = constantService.inputFieldAction.BLUR;
			initInputFieldValidationResult(field, changeOrBlur);
		};
		
		$scope.saveOrUpdate = function (loginInfo) {
			
			// checking for Form validation			
			if (!userService.isValidForm(loginInfo, $scope.isBlockShow.password)) { 
				return; 
			}
			// check duplicate and save or update or return
			isDuplicate(loginInfo);
	    };
	    
	    var isDuplicate = function (userInfo1){
	    	
	    	var params = {};
	    	params.operationType = "CheckDuplicateUserInfo";
	    	params.searchID = userInfo1.loginId;
	    	params.emailID =  userInfo1.email;
	    	params.crudType = $routeParams.actiontype;
	    	params.oid = $routeParams.oid;    	
	    	var promis2 = duplicateValidationService.duplicateValidation(params);
	    	promis2.then(function (data) {
	            if (data.success) {
	            	 if (data.message == "FoundDuplicateLoginID" && $routeParams.actiontype == constantService.Add) {
	 	            	messageService.showMessage(constantService.Danger, constantService.DuplicateData);
	 	            	$('#InputLoginId').focus();
	 	            	return;
	 	            } 
	 	            if (data.message == "FoundDuplicateEmailID") {
	 	            	messageService.showMessage(constantService.Danger, constantService.DuplicateData);
	 	            	$('#InputEmail').focus();
	 	            	return;
	 	            } 
	            }
	          
		        // save or update data
				loadService.showDialog();
		        userInfo1.operationType =  $routeParams.actiontype;
		  		userInfo1.roleJSONArray = [userInfo1.role];
		   		userInfo1.changedBy = loginInfo.data.loginId;
		   		var promis = userService.saveOrUpdateUser(userInfo1);
		   		promis.then(function (data) {
					ngProgress.complete();
					loadService.hideDialog();
		   			if (!data.success) 
		   			{
		   				messageService.showMessage(constantService.Danger, data.message);
						navigationService.goToTop();
		   				return;
		   			}
	              	messageService.showMessage(constantService.Success, data.message);
					navigationService.goToTop();
	              	if($routeParams.actiontype == constantService.Add)
					{
	              		$scope.reset();
					}
			        else if($routeParams.actiontype == constantService.Update)
		        	{
			        	$timeout( function(){ 
	                		  $scope.goBack();  
	                		 }, 3000);	        	        	
		        	}
	              	
		   		});
	    	});
	    };
	 
	    $scope.setUserInfo = function () {
			loadService.showDialog();
	    	$scope.user.loginId = $routeParams.oid;
	    	$scope.user.operationType = constantService.User;
	    	var promisUserInfo = userService.getUserInfoByID($scope.user);
	    	promisUserInfo.then(function(data) {
				ngProgress.complete();
				loadService.hideDialog();
	        	if (!data.success) {
	        		messageService.showMessage(constantService.Danger, data.message);
	                return;
	            }
	        	
	        	$scope.roleInfos = [{ id: "Admin", value: "Admin" }];
	    		$scope.statusInfos = [{ id: "A", value: "Active" },
	    		                      { id: "I", value: "Inactive" }];
	            $scope.user = data.data;
	            $scope.user.role = $.parseJSON(data.data.roleJSON)[0];
	            $scope.loadBankInformation();
	        });
	    };
	    
	    // load banks in combo
	    $scope.loadBankInformation = function () {
	    	loginInfo = localStorageService.getValue(configurationService.loginCookieStoreKey);
	    	var comboInfo = {
	    			comboName : constantService.Bank,
	                operationType: constantService.All
            		};
	        var promisBankInfo = comboService.getAllBankComboList(comboInfo);
	        promisBankInfo.then(function(data) {
	        	if (!data.success) {
	            	console.log(constantService.ComboFailMessage + ":" + constantService.Bank);
	                return;
	            }
	        	$scope.bankInfos = _.where( data.data, {status:status="A"} );
	            //$scope.bankInfos = data.data;
	            loginInfo = localStorageService.getValue(configurationService.loginCookieStoreKey);
	        	if(loginInfo.data.bankID != undefined && loginInfo.data.bankID != null && loginInfo.data.bankID != "")
        		{
	        		$scope.user.bankID = loginInfo.data.bankID;
		        	$scope.isFieldDisabled.bankID = true;
        		}
	        	else
	        		$scope.isFieldDisabled.bankID = false;
	            
	        });
	    };
	    
	    
	    $scope.reset = function(){
	    	$scope.user = {};
	    	$scope.roleInfos = [{ id: "Admin", value: "Admin" }];
			$scope.statusInfos = [{ id: "A", value: "Active" },
			                      { id: "I", value: "Inactive" }];
	    	$routeParams.actiontype = constantService.Add;
	    	$scope.isFieldDisabled.loginId = false;
	    	$scope.isFieldDisabled.password = false;
	    	$scope.loadBankInformation();
	    };
	    
	    $scope.goBack = function(){
			$scope.user = {};
	    	navigationService.menuNavigation('Security_Users');
	    };
	    
	 	var init = function () {
	 		
	 		ngProgress.start();

			fieldValidationInit();
	 		
	 		loginInfo = localStorageService.getValue(configurationService.loginCookieStoreKey);
			if($routeParams.actiontype == constantService.Update)
			{
				$scope.title.value = "UpdateUser";
				$scope.btn_save_up = "btn_Update";
				$scope.setUserInfo();
				$scope.isFieldDisabled.loginId = true;
				$scope.isFieldDisabled.password = true;
				$scope.isBlockShow.resetButton = false;
				$scope.isBlockShow.password = false;
			}
			else 
			{
				$scope.title.value = "CreateUser";
				$scope.btn_save_up = "btn_Save";
				$scope.reset();
				$scope.isBlockShow.resetButton = true;
				$scope.isBlockShow.password = true;
			}
			
	  	    ngProgress.complete();
	 	};

	 	init();
	 	
	 };
	 
    app.register.controller('userInfoSAController', ['$rootScope', '$route', '$routeParams',  '$scope', '$timeout', 
           'userService', 'localStorageService', 'configurationService','messageService', 'constantService',
           'duplicateValidationService', 'comboService', 'ngProgress', 'navigationService', 'loadService', userInfoSAController]);

});

