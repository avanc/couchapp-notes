/*!
 * Copyright (C) 2013, Sven Klomp
 * 
 * Released under the MIT license
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 */




var App = angular.module('NotesApp', ['CornerCouch']);


    
App.directive('mytodo', function () {
    return {
        restrict: 'E',
        template:   '<div ng-hide="editing">' +
                        '<input style="float:right" type="checkbox" ng-model="todo.done" ng-change="saveTodo()"> ' +
                        '<a class="todo_title done-{{todo.done}}" href="" ng-click="toggleDetails()"><span class="todo_date" ng_show="isTickler()">{{todo.date}} </span>{{todo.title}}<span ng_show="detailsavailable() && !showDetails"> &hellip;</span></a> <a href="" ng_show="showDetails" ng-click="editTodo()">&#9998;</a>' +
                        '<div ng_show="showDetails" markup="todo.details"></div>' +
                        '<span ng_show="showDetails" class="tag" ng-repeat="tag in todo.tags">{{tag}}</span>' +
                    '</div>' +
                    '<div ng_show="editing">' +
                        '<input class="todo_title" type="text" ng-model="todo.title"> <a href="" ng-click="saveTodo()">&#10003;</a> <a href="" ng-click="loadTodo()">&#10007;</a><br>' +
                        '<label>Type: </label><select ng-model="todo.subtype" ng-options="subtype for subtype in subtypes" ></select><br>' +
                        '<span ng_show="isTickler()"><input type="text" ng-model="todo.date"><select ng-model="todo.recurrence" ng-options="option for option in recurrencies" ></select><br></span>' +
                        '<textarea class="details_input" ng-model="todo.details.content" placeholder="Details"></textarea><br>' +
                        '<select ng-model="todo.details.language"><option value="unformatted">Unformated</option><option value="markdown">Markdown</option><option value="textile">Textile</option></select><br>' +
                        '<span class="tag" ng-repeat="tag in todo.tags">{{tag}}&nbsp;<a href="" ng-click="removeTag(tag)">&times;</a> </span>' +
                        '<form style="display: inline;" ng-submit="addTag()">' +
                            '<input class="tag" type="text" style="width: 10em;" ng-model="tagText" placeholder="add new tag">' +
                        '</form>' +
                    
                    '</div>',
        scope: {
            todo : "="
        },
        link: function (scope, elem, attrs) {
            scope.subtypes = ["next", "future", "waiting", "tickler"];
            scope.recurrencies = ["daily", "weekly", "monthly", "yearly"];
            
            scope.toggleDetails = function() {
                scope.showDetails=!scope.showDetails;
            };

            scope.editTodo = function() {
                scope.editing=true;
            };

            scope.saveTodo = function() {
                scope.todo.save().success( function() {
                    scope.editing=false;
                });
            };

            scope.loadTodo = function() {
                scope.todo.load().success( function() {
                    scope.editing=false;
                });
            };

            scope.isTickler = function(){
                return (scope.todo.subtype==="tickler");
            }
            
            scope.detailsavailable = function(){
                if (typeof(scope.todo.details)=="undefined") {
                    return false;
                }
                else if (typeof(scope.todo.details.content)=="undefined") {
                    return false;
                }
                else if (scope.todo.details.content=="") {
                    return false;
                }
                else {
                    return true;
                }
            }
            
            scope.addTag = function() {
                scope.todo.tags.push(scope.tagText);
                scope.tagText = '';
            };
         
            scope.removeTag = function(tag) {
                var index = scope.todo.tags.indexOf(tag);
                scope.todo.tags.splice(index, 1);
            };

        }
    }
});
   

App.directive('markup', function () {
    return {
        restrict: 'A',
        scope: true, //Child scope
        link: function (scope, elem, attrs) {
            var converter = new Showdown.converter();
            
            scope.$watch(attrs.markup, function(v) {
                if (typeof(v)!== "undefined") {
                    if (v.hasOwnProperty("language")) {
                        if (v.language=="markdown") {
                            var htmlText = converter.makeHtml(v.content);
                            elem.html(htmlText);
                        }
                        else if (v.language=="textile") {
                            var htmlText = convert_textile(v.content);
                            elem.html(htmlText);
                        }
                        else {
                            elem.html(v.content); 
                        }
                    }
                    else {
                        elem.html(v); 
                    }
                }
            }, true);
        }
    }
});


function AppCtrl($scope, cornercouch) {
    $scope.server = cornercouch();
    $scope.server.session();
    $scope.userdb = $scope.server.getDB('klomp');

    $scope.notes=[];
    
    $scope.getNotes = function() {
    
        $scope.userdb.query("notes", "notes", {include_docs: true })
            .success(function(data, status) {
                var notes=[];
                for (var i=0; i<data.rows.length; i++) {
                    var newdoc=$scope.userdb.newDoc(data.rows[i].doc);
                    notes.push(newdoc);
                }
                notes.push($scope.newNote);
                $scope.notes=notes;
            });
    };

 
    
        
    $scope.initNewNote = function() {
        $scope.newNote = $scope.userdb.newDoc(); 
        $scope.newNote.type = "note";
    }   

    $scope.initNewNote();
    $scope.getNotes();
    
    $scope.addNote = function() {
        $scope.newTodo.save()
            .success(function() {
                $scope.getNotes();
            });
        $scope.initNewNote();
    };
     
}


function getIsoDate(date) {
    if ( typeof(date) == "undefined" ) {
        date= new Date();
    }

    var year = date.getFullYear();
    
    var month = date.getMonth()+1;
    if(month <= 9)
        month = '0'+month;

    var day= date.getDate();
    if(day <= 9)
        day = '0'+day;

    var isoDate = year +'-'+ month +'-'+ day;
    return isoDate;
}

Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + days);
    return this;
};
