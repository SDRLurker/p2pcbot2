var myCond = angular.module('myCond', []);

function mainController($scope, $http) {
    $scope.formData = {};

    // 조건 얻기
    $http.get('/'+sess_id+'/conds')
        .success(function(data) {
            $scope.err='';
            $scope.conds = data;
        }).error(function(err) {
            $scope.err=err.error;
            console.log('err=',err.error);
        });

    // 조건 저장
    $scope.createCond = function() {
        $http.post('/'+sess_id+'/conds', $scope.formData)
            .success(function(data) {
                $scope.err='';
                $scope.formData = {};
                $scope.conds = data;
            }).error(function(err) {
                $scope.err=err.error;
                console.log('err=',err.error);
            });
    }//createCond

    // 조건 삭제
    $scope.deleteCond = function(id) {
        $http.delete('/'+sess_id+'/conds/' + id)
            .success(function(data) {
                $scope.err='';
                $scope.conds = data;
            }).error(function(err) {
                $scope.err=err.error;
                console.log('err=',err);
            });
    }//deleteCond
}//mainController
