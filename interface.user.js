﻿// ==UserScript==
// @name        [s4s] interface
// @namespace   s4s4s4s4s4s4s4s4s4s
// @version     2.0
// @author      le fun css man AKA Doctor Worse Than Hitler, kekero
// @email       doctorworsethanhitler@gmail.com
// @description Lets you view the greenposts.
// @match       https://boards.4chan.org/s4s/thread/*
// @match       http://boards.4chan.org/s4s/thread/*
// @run-at      document-start
// @grant       GM_xmlhttpRequest
// @icon data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZD0iTTAgMEgxNlYxNkgwIiBmaWxsPSIjZGZkIi8+PHBhdGggZD0iTTMgNCA2IDFoNGwzIDN2OGwtMyAzSDZMMyAxMiIgZmlsbD0iZ3JlZW4iLz48cGF0aCBkPSJtNS41IDExLjVoLTJ2LTdoMnYtM2MtMyAwLTUgMi41LTUgNi41IDAgNCAyIDYuNSA1IDYuNXptNSAzYzMgMCA1LTIuNSA1LTYuNSAwLTQtMi02LjUtNS02LjV2M2gydjdoLTJ6bS00LTRoM0wxMCAyLjVINlptMCAzaDN2LTNoLTN6IiBmaWxsPSIjZmZmIiBzdHJva2U9ImdyZWVuIi8+PC9zdmc+
// ==/UserScript==

var threadId=location.pathname.match(/\/thread\/(\d+)/)[1]
var weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
var postFormClassic
var postFormQRX

// Request green posts
var serverurl="https://funposting.online/interface/"
GM_xmlhttpRequest({
	method:"get",
	url:serverurl+"get.php?thread="+threadId,
	onload:response=>{
		if(response.status==200){
			onPageLoad(_=>{
				var postsobj=JSON.parse(response.responseText)
				Object.keys(postsobj).forEach(i=>{
					addPost(postsobj[i])
				})
			})
		}
	}
})

// 4chan-X QR integration
document.addEventListener("QRDialogCreation",onQRXCreated,false)

onPageLoad(_=>{
	// Classic post form
	var nameField=query("#postForm input[name=name]")
	var greenToggle=element(
		["button#toggle",{
			class:"greenToggle",
			title:"[s4s] Interface",
			onclick:event=>{
				event.preventDefault()
				event.stopPropagation()
				showPostFormClassic()
			}
		},"!"]
	).toggle
	var nameParent=nameField.parentNode
	nameParent.classList.add("nameFieldParent")
	nameParent.insertBefore(greenToggle,nameField)
})

function onPageLoad(func){
	if(document.readyState=="loading"){
		addEventListener("DOMContentLoaded",func)
	}else{
		func()
	}
}

// Add a post to the proper position in the thread
function addPost(aPost){
	var numberless=aPost.options=="numberless"
	var afterNo=numberless?"XXXXXX":aPost.after_no
	var postId=afterNo+"-"+aPost.id
	var date=new Date(aPost.timestamp*1000)
	var dateString=
		padding(date.getDate(),2)+"/"+
		padding(date.getMonth()+1,2)+"/"+
		(""+date.getFullYear()).slice(-2)+
		"("+weekdays[date.getDay()]+")"+
		padding(date.getHours(),2)+":"+
		padding(date.getMinutes(),2)+":"+
		padding(date.getSeconds(),2)
	var linkReply
	if(!numberless){
		linkReply=[0,
			" ",
			["a",{
				href:"#p"+postId,
				title:"Link to this post"
			},"No."],
			["a",{
				href:"javascript:quote('"+postId+"');",
				title:"Reply to this post"
			},postId]
		]
	}
	var post=element(
		["div#post",{
			class:"postContainer replyContainer greenPostContainer",
			id:"pc"+aPost.after_no
		},
			["div",{
				class:"sideArrows",
				id:"sa"+postId
			},">>"],
			["div",{
				class:"post reply",
				id:"p"+postId
			},
				["div",{
					class:"postInfoM mobile",
					id:"pim"+postId
				},
					["span",{
						class:"nameBlock"
					},
						["span",{
							class:"name"
						},aPost.username],
						["br"]
					],
					["span",{
						class:"dateTime postNum",
						"data-utc":aPost.timestamp
					},
						dateString,
						linkReply
					]
				],
				["div",{
					class:"postInfo desktop",
					id:"pi"+postId
				},
					["input",{
						type:"checkbox",
						name:"ignore",
						value:"delete"
					}],
					["span",{
						class:"nameBlock"
					},
						["span",{
							class:"name"
						},aPost.username]
					],
					" ",
					["span",{
						class:"dateTime",
						"data-utc":aPost.timestamp
					},dateString],
					(!numberless&&
						["span",{
							class:"postNum desktop"
						},linkReply]
					)
				],
				["blockquote",{
					class:"postMessage",
					id:"m"+postId,
					innerHTML:aPost.text
				}]
			]
		]
	).post
	// Add the post
	var afterPost=query("#pc"+aPost.after_no)
	if(afterPost){
		insertAfter(post,afterPost)
	}else{
		// Parent post is deleted
		var currentPost=query(".thread>.postContainer:last-of-type")
		while(1){
			var prevPost=currentPost.previousSibling
			if(!prevPost||prevPost.id.split("pc")[1]<aPost.after_no){
				break
			}
			currentPost=prevPost
		}
		currentPost.parentNode.insertBefore(post,currentPost)
	}
	return
}

// Classic post form
function showPostFormClassic(hide){
	var formSelector="body>form:not(.greenPostForm)"
	var nameField=query(formSelector+" input[name=name]")
	var optionsField=query(formSelector+" input[name=email]")
	var commentField=query(formSelector+" textarea")
	if(hide){
		if(postFormClassic){
			nameField.value=postFormClassic.name.value
			optionsField.value=postFormClassic.options.value
			commentField.value=postFormClassic.comment.value
			postFormClassic.form.parentNode.removeChild(postFormClassic.form)
			postFormClassic=0
		}
		return
	}
	var postForm=query("#postForm").parentNode
	if(postFormClassic||!postForm){
		return
	}
	postFormClassic=element(
		["form#form",{
			name:"post",
			action:serverurl+"post.php",
			method:"post",
			enctype:"multipart/form-data",
			class:"greenPostForm"
		},
			["table",{
				class:"postForm hideMobile"
			},
				["tbody",
				["tr",
					["td","Name"],
					["td",{
						class:"nameFieldParent"
					},
						["button#toggle",{
							class:"greenToggle pressed",
							title:"[s4s] Interface",
							onclick:event=>{
								event.preventDefault()
								event.stopPropagation()
								showPostFormClassic(1)
							}
						},"!"],
						["input#name",{
							type:"text",
							name:"username",
							tabIndex:1,
							placeholder:"Anonymous",
							value:nameField.value
						}]
					]
				],
				["tr",
					["td","Options"],
					["td",
						["input#options",{
							type:"text",
							name:"options",
							tabIndex:2,
							value:optionsField.value
						}],
						["input",{
							type:"submit",
							tabIndex:6,
							value:"Post"
						}]
					]
				],
				["tr",
					["td","Comment"],
					["td",
						["textarea#comment",{
							name:"text",
							tabindex:4,
							cols:48,
							rows:4,
							wrap:"soft",
							value:commentField.value
						}]
					]
				]
				]
			]
		]
	)
	postForm.parentNode.insertBefore(postFormClassic.form,postForm)
}

// 4chan-X QR
function onQRXCreated(){
	var qrPersona=query("#qr .persona")
	if(!qrPersona){
		return
	}
	var toggle=element(
		["button#toggle",{
			type:"button",
			class:"greenToggle",
			title:"[s4s] Interface",
			onclick:event=>{
				showPostFormQRX()
			}
		},"!"]
	).toggle
	qrPersona.insertBefore(toggle,qrPersona.firstChild)
}

function showPostFormQRX(hide){
	var formSelector="#qr form:not(.greenPostForm)"
	var nameField=query(formSelector+" input[name=name]")
	var optionsField=query(formSelector+" input[name=email]")
	var commentField=query(formSelector+" textarea")
	if(hide){
		if(postFormQRX){
			nameField.value=postFormQRX.name.value
			optionsField.value=postFormQRX.options.value
			commentField.value=postFormQRX.comment.value
			postFormQRX.form.parentNode.removeChild(postFormQRX.form)
			postFormQRX=0
		}
		return
	}
	var qr=query("#qr>form")
	if(postFormQRX||!qr){
		return
	}
	postFormQRX=element(
		["form#form",{
			name:"post",
			action:serverurl+"post.php",
			method:"post",
			enctype:"multipart/form-data",
			class:"greenPostForm"
		},
			["input",{
				name:"thread",
				value:threadId,
				type:"hidden"
			}],
			["div",{
				class:"persona"
			},
				["button",{
					type:"button",
					class:"greenToggle pressed",
					title:"[s4s] Interface",
					onclick:event=>{
						showPostFormQRX(1)
					}
				},"!"],
				["input#name",{
					name:"username",
					class:"field",
					placeholder:"Name",
					size:1,
					value:nameField.value
				}],
				["input#options",{
					name:"options",
					class:"field",
					placeholder:"Options",
					size:1,
					value:optionsField.value
				}]
			],
			["textarea#comment",{
				name:"text",
				class:"field",
				placeholder:"Comment",
				value:commentField.value
			}],
			["div",{
				class:"file-n-submit"
			},
				["input",{
					type:"submit",
					value:"Submit"
				}]
			]
		]
	)
	qr.parentNode.insertBefore(postFormQRX.form,qr)
}

// Stylesheet
var blob=new Blob([`
.greenPostForm+form .postForm>tbody>tr:not(.rules),
#qr .greenPostForm+form{
	display:none;
}
.greenPostForm .file-n-submit{
	display:flex;
	align-items:stretch;
	justify-content:flex-end;
	height:25px;
	margin-top:1px;
}
.greenPostForm .file-n-submit input{
	width:25%;
	background:linear-gradient(to bottom,#f8f8f8,#dcdcdc) no-repeat;
	border:1px solid #bbb;
	border-radius:2px;
	height:100%;
}
.greenPostContainer .post.reply{
	background-color:#dfd!important;
	border:2px solid #008000!important;
}
.greenPostContainer .postMessage{
	color:#000!important;
}
.greenToggle{
	font-family:monospace;
	font-size:16px;
	line-height:17px;
	background:#ceb!important;
	width:24px;
	padding:0;
	border:1px solid #bbb;
}
.greenPostForm input:not([type=submit]),
.greenPostForm textarea{
	background-color:#dfd;
	color:#000;
}
.greenToggle.pressed{
	background:#6d6!important;
	font-weight:bold;
	color:#fff;
}
.postForm .greenToggle+input{
	width:220px!important;
}
.postForm .nameFieldParent{
	display:flex;
	flex-direction:row;
}
.postForm textarea{
    width:292px;
}
`],{
	type:"text/css"
})
element(
	document.head,
	["link",{
		rel:"stylesheet",
		href:URL.createObjectURL(blob)
	}]
)

function query(selector){
	return document.querySelector(selector)
}

function padding(string,num){
	return (""+string).padStart(num,0)
}

function insertAfter(newElement,targetElement){
	var parentNode=targetElement.parentNode
	var nextSibling=targetElement.nextSibling
	if(nextSibling){
		parentNode.insertBefore(newElement,nextSibling)
	}else{
		parentNode.appendChild(newElement)
	}
}

function element(){
	var parent
	var lasttag
	var createdtag
	var toreturn={}
	for(var i=0;i<arguments.length;i++){
		var current=arguments[i]
		if(current){
			if(current.nodeType){
				parent=lasttag=current
			}else if(Array.isArray(current)){
				for(var j=0;j<current.length;j++){
					if(current[j]){
						if(!j&&typeof current[j]=="string"){
							var tagname=current[0].split("#")
							lasttag=createdtag=document.createElement(tagname[0])
							if(tagname[1]){
								toreturn[tagname[1]]=createdtag
							}
						}else if(current[j].constructor==Object){
							if(lasttag){
								for(var value in current[j]){
									if(value!="style"&&value in lasttag){
										lasttag[value]=current[j][value]
									}else{
										lasttag.setAttribute(value,current[j][value])
									}
								}
							}
						}else{
							var returned=element(lasttag,current[j])
							for(var k in returned){
								toreturn[k]=returned[k]
							}
						}
					}
				}
			}else if(current){
				createdtag=document.createTextNode(current)
			}
			if(parent&&createdtag){
				parent.appendChild(createdtag)
			}
			createdtag=0
		}
	}
	return toreturn
}
