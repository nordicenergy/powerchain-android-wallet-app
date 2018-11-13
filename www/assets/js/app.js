const storage = window.localStorage;
const backend_development = "https://2le29wvge7.execute-api.eu-central-1.amazonaws.com/latest/";
const backend_production = 'https://app.corrently.de/api/';
const backend = backend_production;

$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});


let eth_balance=0;

let user_data={
  balance_kwha:0,
  balance_corrently:0,
  kwh_autark:0,
  convertedSupply:0,
  balance_cori:0,
  balance_autark:0
}
let offers={};

const renderPortfolioGraph=function(id,portfolio) {
  const ctx = $('#'+id);

  const colors = ['#5BC0EB', '#FDE74C', '#9BC53D', '#C3423F', '#404E4D', '#D4AA7D', '#EFD09E', '#336600'];
  let labels = [];
  let data=[];
  let backgroundColor=[];
  $.each(portfolio,function(k,v) {
      data.push(v.cori);
      $('.balance_'+k+'').html(v.cori);
      backgroundColor.push(colors.pop());
      labels.push(v.title);
  });

  const datasets = [{
      data:data,
      backgroundColor:backgroundColor,
      label:'Erzeugungs Portfolio'
  }];
  let config = {
			type: 'doughnut',
      data: {
        datasets:datasets,
        labels: labels
      },
      options:{
        responsive: true,
				legend: {
					position: 'top',
				},
				title: {
					display: false,
					text: 'Erzeugungsportfolio'
				},
				animation: {
					animateScale: true,
					animateRotate: true
				},
        tooltips: {
              callbacks: {
                  label: function(tooltipItem, data) {
                      return data.labels[tooltipItem.index]+": "+data.datasets[0].data[tooltipItem.index]+" kWh/Jahr";
                  }
              }
        }
      }
  }
  $('#'+id+"_box").show();
  $('#info_box').show();
  window.myDoughnut = new Chart(ctx, config);
}
const demandLineChart=function(dgyid) {
  const ctx = $('#demand');

  $.getJSON(backend+"demand?dgyid="+dgyid,function(data) {
      const colors = ['#5BC0EB', '#FDE74C', '#9BC53D', '#C3423F', '#404E4D', '#D4AA7D', '#EFD09E', '#336600'];
      var labels = [];

      let lastPosition = 'right';
      var i=0;
      var chart_data=[];
      var j=0;

      $.each(data,function(k,v) {
          let energy=(""+v.values.energy).substr(0,(""+v.values.energy).length-7)*1;
          if(typeof energyOld=="undefined") {
            energyOld=energy;
          } else {
            let power=energy-energyOld;
            energyOld=energy;
            if(power>0) {
            chart_data.push((power/1000).toFixed(3));
            labels.push(moment(new Date(v.time)).format("D.M"));
            }
          }
      });
      console.log(i,j);

      const color = colors.pop();


      const myLineChart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets:[
            {
                  label:"Strombedarf",
                  fill:false,
                  data:chart_data,
                  backgroundColor:color,
                  borderColor:color
            }
          ],
          labels: labels
        },
        options: {
          responsive: true,
          hoverMode: 'index',
          stacked: false,
          title: {
            display: false,
            text: 'Performance'
          },
          legend: {
              display: true,
              position: "bottom"
          },
          tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        return ""+data.datasets[0].data[tooltipItem.index].replace('.',',')+" kWh";
                    }
                }
          }
        }
      });
  });
}

const performanceLineChart=function(id,data,title,subdata,container) {
  const ctx = $('#'+id);
  const datasets = {};
  const colors = ['#5BC0EB', '#FDE74C', '#9BC53D', '#C3423F', '#404E4D', '#D4AA7D', '#EFD09E', '#336600'];
  const labels = [];

  let lastPosition = 'right';
  var i=0;

  const color = colors.pop();
  datasets["total"] = {};
  datasets["total"].label = title;
  datasets["total"].fill = false;
  datasets["total"].data = [];
  //datasets[key].yAxisID = 'y-axis-' + key;
  datasets["total"].backgroundColor = color;
  datasets["total"].borderColor = color;

  subdata.forEach(function(skey) {
       i++;
       let key=skey.field;
       if (typeof datasets[key] === 'undefined') {
         if (lastPosition === 'right') {
           lastPosition = 'left';
         } else {
           lastPosition = 'right';
         }
         var keylabel = key;

         const color = colors.pop();
         datasets[key] = {};
         datasets[key].label = skey.label;
         datasets[key].fill = false;
         datasets[key].data = [];
         //datasets[key].yAxisID = 'y-axis-' + key;
         datasets[key].backgroundColor = color;
         datasets[key].borderColor = color;
         datasets[key].scaleY = {
           type: 'linear',
           display: true,
           position: lastPosition,
           id: 'y-axis-' + key
         };
       }
  });

  for (const k in data) {
    if(k.indexOf("day_")==0) {
      datasets["total"].data.push((data[k]*100).toFixed(2));
      labels.push(moment(new Date((k.substr(4)*86400000)-86400000)).format("D.M"));
      subdata.forEach(function(skey) {
        let key2=skey.field;
         if(typeof container.sides[key2].history[k] != "undefined") {
           datasets[key2].data.push(( container.sides[key2].history[k]*100).toFixed(2));
         } else {
           datasets[key2].data.push("-");
         }
      });
    }
  }

  const chartDatasets = [];
  const yaxis = [];
  for (const key in datasets) {
    const value = datasets[key];
      chartDatasets.push(value);
      yaxis.push(value.scaleY);
  }

  const myLineChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: chartDatasets,
      labels: labels
    },
    options: {
      responsive: true,
      hoverMode: 'index',
      stacked: false,
      title: {
        display: false,
        text: 'Performance'
      },
      legend: {
          display: true,
          position: "bottom"
      },
      scales: {
        // yAxes: yaxis,
        xAxes: [{
          display: true,
          scaleLabel: {
            display: false,
            labelString: 'Date'
          }
        }]
      },
      pan: {
        enabled: true,
        mode: 'xy'
      },
      zoom: {
        enabled: true,
        mode: 'x'
      },
      tooltips: {
            callbacks: {
                label: function(tooltipItem, data) {
                    return "Performance "+data.datasets[0].data[tooltipItem.index].replace('.',',')+" %";
                }
            }
      }
    }
  });
}

let transactions = [];


const buyTransaction = function(x,eth,qty) {
  if((typeof qty == "undefined")||(qty==null)||(qty==0)) {
    qty=1;
  }
  if((user_data.balance_corrently>offers[x].cori)||(eth>0)) {
      let signature="";

      const sendBackend = function() {
        $.getJSON(backend+"signedTransaction?transaction="+encodeURI(JSON.stringify(transaction))+"&signature="+signature,function(data) {
          refreshUserData();
        });
      }

      user_data.balance_corrently-=offers[x].cori*qty;
      user_data.balance_cori+=qty;
      user_data.used_corrently+=offers[x].cori*qty;
      offers[x].availableSupply--;
      let transaction={};
      transaction.cori=qty;
      transaction.corrently=offers[x].cori*qty;
      transaction.timeStamp=new Date().getTime();
      transaction.asset=x;
      transaction.eth=eth;
      transaction.nonce=transactions.length;

      if(eth>0) {
          window.wallet.send('0xfA21Fb716322eE4EBBeC6AeFB9208A428e0B56F4',ethers.utils.parseEther(""+eth)).then(function(tx) {
            transaction.hash=tx;
            signature=window.wallet.signMessage(JSON.stringify(transaction));
            sendBackend();
          });
      } else {
          signature=window.wallet.signMessage(JSON.stringify(transaction));
          sendBackend();
      }
      transactions.push(transaction);
      bootstrap();
  }
}
var hashes={};

const refreshHashes = function() {
  $.each(hashes,function(k,v) {
    $('.'+k).html(v);
  });
}
const refreshOfferData = function() {
      let html="";
      $.each(offers,function(k,v) {
        var y="-";
        if(typeof myassets[k]!="undefined")  {
          if(typeof myassets[k].cori!="undefined")  y=myassets[k].cori;
        }
        if((typeof v.market == "undefined")||(v.market == true)) {
        html+='<div class="card">';
          html+='<div class="card-header bg-dark text-light">';
            html+=''+v.title+'';
          html+='</div>';
          html+='<canvas class="card-img-top" style="min-height:250px;padding-top:5px" id="chart_'+k+'"></canvas>';
          html+='<div class="card-body">';
          html+='<div class="row">';
              html+='<div class="col">';
                html+='<strong>Eigentum (kWh/Jahr)</strong>';
              html+='</div>';
              html+='<div class="col" style="text-align:right;">';
              html+="<strong><span class='balance_"+k+"'>"+y+"</span></strong>";
              html+='</div>';
          html+='</div>';
            html+='<div class="row">';
                html+='<div class="col">';
                  html+='Betreiber/Emitent';
                html+='</div>';
                html+='<div class="col" style="text-align:right;">';
                      html+=''+v.emitent+'';
                html+='</div>';
            html+='</div>';
            html+='<div class="row">';
                html+='<div class="col">';
                  html+='Erzeugung bis (mindestens)';
                html+='</div>';
                html+='<div class="col" style="text-align:right;">';
                      html+='<a href="./'+v.asset+'.html">'+v.decom+'</a>';
                html+='</div>';
            html+='</div>';
            html+='<div class="row">';
                html+='<div class="col">';
                  html+='Corrently je kWh pro Jahr';
                html+='</div>';
                html+='<div class="col" style="text-align:right;">';
                      html+=''+v.cori+'';
                html+='</div>';
            html+='</div>';
            let disabled='';
            if(v.cori>user_data.balance_corrently) disabled='disabled="disabled"';
            html+='<div style="text-align:center;>';
            html+='<div class="dropdown">';
            let ethprice=v.cori*(1/187);
            if(ethprice>eth_balance) disabled='disabled="disabled"'; else disabled='';
            if(eth_balance>0) {
              html+='<button class="btn btn-warning btn-sm" '+disabled+' style="margin-right:2px" onclick="buyTransaction(\''+k+'\','+ethprice+');">'+ethprice.toFixed(4).replace('.',',')+' ETH nutzen</button>';
            }
            if(v.cori>user_data.balance_corrently) disabled='disabled="disabled"'; else disabled='';

            html+='<button class="btn btn-success btn-sm dropdown-toggle" '+disabled+' data-toggle="dropdown">Corrently einlösen</button>';
            html+='<div class="dropdown-menu bg-success">';
              html+=' <a class="dropdown-item bg-success text-light" href="#" onclick="buyTransaction(\''+k+'\',0,1);">'+v.cori+' Corrently (1 kWh/Jahr)</a>';
              for(let x=10;v.cori*x<user_data.balance_corrently;x+=10) {
                  html+=' <a class="dropdown-item bg-success text-light" href="#" onclick="buyTransaction(\''+k+'\',0,'+x+');">'+(x*v.cori)+' Corrently ('+x+' kWh/Jahr)</a>';
              }
            html+='</div>';
            html+='</div>';
            html+='</div>';
          html+='</div>';
        html+='</div>';
        }
      });
      $('#offers').html(html);
      if((storage.getItem("hash") != null)&&(transactions.length==0)&&(user_data.balance_corrently>100)) {
        buyTransaction("0xabbd396e4e96517a63a834a3177f8b2809e1bd6682547f1d07bc5bf8073a99d3",0,1);
      }
      $.each(offers,function(k,v) {
        $.getJSON( backend + "assetPerformance?asset="+v.contract,function(data) {
            data.chartData=[];
            for(var x=data.results.last_day-data.results.history_cnt;x<=data.results.last_day;x++) {
              data.chartData["day_"+x]=data.results["day_"+x];
            }
            data.chartData=data.chartData.reverse();
            performanceLineChart('chart_'+k,data.chartData,'Plan/Ist Erzeugung',[],data);
        });
      });
}

let myassets={};
let old_txlength=0;
const refreshTransactions = function() {
  var html="";
  let txs = transactions.reverse();
  myassets={};
  let eigenstrom=0;
  const timeSort = function(a,b) {
      if (a.timeStamp < b.timeStamp)
        return 1;
      if (a.timeStamp > b.timeStamp)
        return -1;
      return 0;
  }
  txs=txs.reverse();
  txs.sort(timeSort);

  $.each(txs,function(k,v) {
    if(typeof v.transactionHash != "undefined") {
      hashes[""+v.transactionHash]=offers[v.asset].title;
      refreshHashes();
    } else {
        html+="<div class='row'>";
        html+="<div class='col'>";
        html+=new Date(v.timeStamp).toLocaleString();
        html+="</div>";
        html+="<div class='col' style='text-align:left'>";
        html+=offers[v.asset].title;
        html+="</div>";
        html+="<div class='col' style='text-align:right'>";
        html+=v.corrently;
        html+="</div>";
        html+="<div class='col' style='text-align:right'>";
        html+=v.cori;
        html+="</div>";
        html+="</div>";
    }
    eigenstrom+=(((new Date().getTime()-v.timeStamp)/(86400*365))/1000)*v.cori;
    if(typeof myassets[v.asset]=="undefined") {
      myassets[v.asset]={
        cori:0,
        corrently:0
      };
      }
      myassets[v.asset].cori+=v.cori;
      myassets[v.asset].title=offers[v.asset].title;
      myassets[v.asset].corrently+=v.corrently;
  });
  lbl=eigenstrom.toFixed(8);
  if(eigenstrom>0.001) lbl=eigenstrom.toFixed(7);
  if(eigenstrom>0.01) lbl=eigenstrom.toFixed(6);
  if(eigenstrom>0.1) lbl=eigenstrom.toFixed(4);

  $(".balance_eigenstrom").html((lbl).replace(".",","));
  if(eigenstrom>0) {
    setTimeout(refreshTransactions,1000);
  }
  $('.transactions').html(html);
  if((txs.length>0)&&(old_txlength!=txs.length)) {
    $('#tx_alert').show();
    $('#tx_history').show();
    old_txlength=txs.length;
    renderPortfolioGraph('portfolio',myassets);

  }
}
const refreshAliases = function(aliases) {
  const processAlias = function(alias) {
    window.CorrentlyNote.getNoteByAccount(alias).then(function(receipt) {
      var html="";
      $.each(receipt.logs,function(k,v) {
        let log = receipt.logs[k];
        console.log(log);
        html+="<div class='row'>";
        html+="<div class='col'>";
        html+=new Date(log.timeStamp).toLocaleString();
        html+="</div>";
        html+="<div class='col "+log.transactionHash+"'></div>";
        html+="<div class='col' style='text-align:right'>";
        html+=(log.ccori/100).toFixed(2).replace('.',',');
        html+="</div>";
        html+="<div class='col' style='text-align:right'>";
        if(log.energy>0.00001) log.energy=(log.energy*1).toFixed(8);
        if(log.energy>0.001) log.energy=(log.energy*1).toFixed(6);
        if(log.energy>0.01) log.energy=(log.energy*1).toFixed(5);
        if(log.energy>0.1) log.energy=(log.energy*1).toFixed(3);
        html+=(""+log.energy).replace('.',',');
        html+="</div>";
        html+="</div>";
      })
      $('#aliases').append(html);
      refreshHashes();
    });
  }
  let html="";
  html+="<div class='row'>";
  html+="<div class='col'>";
  html+="<strong>Datum/Uhrzeit</strong>";
  html+="</div>";
  html+="<div class='col'>";
  html+="<strong>Erzeuger</strong>";
  html+="</div>";
  html+="<div class='col' style='text-align:right'>";
  html+="<strong>kWh/Jahr</strong>";
  html+="</div>";
  html+="<div class='col' style='text-align:right'>";
  html+="<strong>Erzeugter Correntlystrom (kWh)</strong>";
  html+="</div>";
  html+="</div>";
  $('#aliases').html(html);
  $.each(aliases,function(k,v) {
    processAlias(aliases[k]);
  });
}
const refreshUserData = function() {
  let uriInfo="";

  if(storage.getItem("hash") != null) uriInfo+="&hash="+storage.getItem("hash");

  $.getJSON(backend+"totalSupply?account="+window.wallet.address+uriInfo,function(data) {
    user_data.balance_corrently=data.result.totalSupply-data.result.convertedSupply;
    user_data.convertedSupply=data.result.convertedSupply;
    user_data.balance_cori=data.result.nominalCori;
    user_data.balance_kwha = data.result.ja;
    if(Math.round(user_data.convertedSupply)>0) {
      $('#nav_wallet').show();
    }
    if(Math.round(user_data.balance_kwha)==0) {
      user_data.balance_autark=100;
      user_data.kwh_autark=user_data.balance_cori;
      $('#nav_stromtarif').show();
    }else {
      let autark=(user_data.balance_cori/user_data.balance_kwha)*100;
        if(autark<100) user_data.balance_autark=(autark).toFixed(1);
        if(autark<10) user_data.balance_autark=(autark).toFixed(2);
        if(autark<1) user_data.balance_autark=(autark).toFixed(5);

        user_data.balance_kwha=data.result.ja;
        if(user_data.balance_autark>0) {
          user_data.kwh_autark=(user_data.balance_kwha*(user_data.balance_autark/100)).toFixed(0);
        } else  { user_data.kwh_autark=0;}
    }
    if(typeof data.result.aliases != "undefined") {
      refreshAliases(data.result.aliases);
    }
    $.each(user_data,function(k,v) {
          $("."+k).html(v);
        });
    transactions=data.result.txs;

    refreshTransactions();
    refreshOfferData();
    if(typeof data.result.dgy_id!="undefined") {
      $('#demand_box').show();
      $('#info_box').show();
      demandLineChart(data.result.dgy_id);
    } else {
      $('#demand_box').hide();
    }
  });
}

const bootstrap=function() {

  if((typeof $.getUrlVars()["hash"] != "undefined")&&(location.pathname=="/m.html")) {
    if(storage.getItem("hash")==$.getUrlVars()["hash"]) {
        location.replace("/main.html");
    } else {
      new ethers.Wallet.fromBrainWallet($.getUrlVars()["hash"],"nfc").then(function(wallet) {
        storage.setItem("account",wallet.address);
        storage.setItem("pk",wallet.privateKey);
        storage.setItem("hash",$.getUrlVars()["hash"]);
        location.replace("/main.html");
      });
    }
  } else
  if(location.pathname == "/m.html") {
    storage.removeItem("account");
    storage.removeItem("pk");
    location.replace("/main.html");
  }
  if(storage.getItem("account")==null) {
    window.wallet=ethers.Wallet.createRandom();
    storage.setItem("account",window.wallet.address);
    storage.setItem("pk",window.wallet.privateKey);
  } else {
    window.wallet=new ethers.Wallet(storage.getItem("pk"));
  }

  window.wallet.provider=ethers.providers.getDefaultProvider();
  console.log("Serving for ",window.wallet.address);
  $('#etherscan').attr('href','https://etherscan.io/address/'+window.wallet.address);
  $('.address').html(window.wallet.address);
  $('#scan_account').val(window.wallet.address);

  window.wallet.getBalance().then(function(balance) {
    eth_balance=ethers.utils.formatEther(balance);
    $('.balance_eth').html((ethers.utils.formatEther(balance)*1).toFixed(5));
    if(balance>0) {
      refreshOfferData();
    }
  });
  $.getJSON(backend + "market",function(data) {
    $.each(data.results,function(k,v) {
        offers[v.contract]=v;
    })
    refreshUserData();
  });
}
$(document).ready(bootstrap);
$('#logout').click(function() {
    storage.removeItem("account");
    storage.removeItem("pk");
    location.reload(-1);
});
$('#loginBrain').click(function() {
    $('#loginBrain').attr('disabled','disabled');
    new ethers.Wallet.fromBrainWallet($('#username').val(),$('#password').val()).then(function(wallet) {
      storage.setItem("account",wallet.address);
      storage.setItem("pk",wallet.privateKey);
      location.reload(false);
    });
});
$('#showPK').click(function() {
  let html="";
  html+="<input type='text' id='npk' class='form-control' value='"+window.wallet.privateKey+"'>";
  $('#opk').html(html);
  $('#npk').on('change',function() {
      storage.setItem("pk",$('#npk').val());
  });
});
$('#connectDemand').click(function() {
  $('#connectDemand').attr('disabled','disabled');
  const sendBackend = function() {
    $.getJSON(backend+"link?transaction="+encodeURI(JSON.stringify(transaction))+"&signature="+signature,function(data) {
      console.log(data);
      $('#connectDemand').removeAttr('disabled');
    });
  }

  let transaction={};
  transaction.link=$('#demandSide').val();
  signature=window.wallet.signMessage(JSON.stringify(transaction));
  sendBackend();
});

function doScan() {
  $('#scan_do').attr('disabled','disabled');
  let uriInfo="";

  $.getJSON(backend+"totalSupply?account="+encodeURI($('#scan_account').val()+uriInfo),function(data) {
    $('#scan_do').removeAttr('disabled');
    $('.scan_demand').html(data.result.ja);
    $('.scan_totalSupply').html(data.result.totalSupply);
    $('.scan_convertedSupply').html(data.result.convertedSupply);
    $('.scan_availableSupply').html(data.result.totalSupply-data.result.convertedSupply);
    $('.scan_generation').html(data.result.nominalCori);
    $('.scan_eigenstrom').html(((data.result.nominalCori/data.result.ja)*100).toFixed(6));
    $('.scan_meteredGeneration').html((data.result.generation).toFixed(6));
    $('.scan_meteredConsumption').html((data.result.meteredconsumption).toFixed(6));
    $('.scan_meteredBalance').html((data.result.generation-data.result.meteredconsumption).toFixed(6));

  });
}
$('#scan_do').click(doScan);

setInterval(refreshTransactions,60000);
