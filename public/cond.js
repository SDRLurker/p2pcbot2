var myCond = angular.module('myCond', []);

function mainController($scope, $http) {
    $scope.formData = {};
    var link = document.location.href;
    var slash = link.lastIndexOf('/');
    var sess_id = link.substring(slash+1);
    //console.log(link.substring(slash+1));

    // Todo 얻기
    $http.get('/'+sess_id+'/conds')
        .success(function(data) {
            $scope.conds = data;
        }).error(function(err) {
            console.log('err=' + err);
        });

    // Todo 저장
    $scope.createCond = function() {
        console.log($scope.formData);
        $http.post('/'+sess_id+'/conds', $scope.formData)
            .success(function(data) {
                $scope.formData = {};
                $scope.conds = data;
                console.log(data);
            }).error(function(err) {
                console.log('err=' + err);
            });
    }//createCond

    // Todo 삭제
    $scope.deleteCond = function(id) {
        console.log(sess_id, id);
        $http.delete('/'+sess_id+'/conds/' + id)
            .success(function(data) {
                console.log(data);
                $scope.conds = data;
            }).error(function(err) {
                console.log('err=' + err);
            });
    }//deleteCond

}//mainController
