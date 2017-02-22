/**
 * Created by werner rauch on 09.02.2017.
 */

var crObj = {};

var sokesoft = {};
sokesoft.eresse = {};
sokesoft.eresse.webview = function(configuration) {

    var $element;
    var $regions;
    var $regionData;
    var $dropInfo;
    var $trigger = $('body');

    var crData;

    /**
     * Init
     */
    var init = function() {
        $element = $(configuration.element);
        $regions = $element.find('.regions');
        $regionData = $element.find('.regionData');
        $dropInfo = $element.find('.dropInfo');

        setEvents();
    };

    /**
     * setEvents
     */
    var setEvents = function() {
        $("#imageInput").change(function(e){
          if($("#imageInput").val() != ""){
              if(document.getElementById("imageInput").files[0].name.indexOf('zip') != -1){
                  getCrFromZip(document.getElementById("imageInput").files[0]);
              }else{
                  oFReader.readAsText( document.getElementById("imageInput").files[0] );
              }
          }
        });

        prepareDragAndDrop();

        $trigger.on('crLoaded', function() {
            parseCR();
        });
        $trigger.on('crReady', function() {
            buildMap();
        });
        $trigger.on('mapReady', function() {
            $regions.find('div').on('click', function(e) {
                $regionData.html(crObj['REGION'][$(e.currentTarget).data('region')].Name);
            });
        });
    };

    /**
     * buildMap
     */
    var buildMap = function() {
        var mapImages = '';
        var regionDimension = [];
        regionDimension['x'] = [0, 0];
        regionDimension['y'] = [0, 0];

        for(var regionItem in crObj['REGION']) {
            if(crObj['REGION'].hasOwnProperty(regionItem)) {
                var mapTileName = '';
                switch(crObj['REGION'][regionItem].Terrain) {
                    case 'Wald':
                        mapTileName = 'wald.png';
                        break;
                    case 'Sumpf':
                        mapTileName = 'sumpf.png';
                        break;
                    case 'Gletscher':
                        mapTileName = 'gletscher.png';
                        break;
                    case 'Wüste':
                        mapTileName = 'wueste.png';
                        break;
                    case 'Hochland':
                        mapTileName = 'hochland.png';
                        break;
                    case 'Berge':
                        mapTileName = 'berge.png';
                        break;
                    case 'Ebene':
                        mapTileName = 'ebene.png';
                        break;
                    default:
                        crObj['REGION'][regionItem].Name = 'Ozean';
                        mapTileName = 'ozean.png';
                        break;
                }
                if(crObj['REGION'][regionItem].x < 0) {
                    if(crObj['REGION'][regionItem].x < regionDimension['x'][0]) {
                        regionDimension['x'][0] = crObj['REGION'][regionItem].x;
                    }
                } else if(crObj['REGION'][regionItem].x > 0) {
                    if(crObj['REGION'][regionItem].x > regionDimension['x'][1]) {
                        regionDimension['x'][1] = crObj['REGION'][regionItem].x;
                    }
                }
                if(crObj['REGION'][regionItem].y < 0) {
                    if(crObj['REGION'][regionItem].y < regionDimension['y'][0]) {
                        regionDimension['y'][0] = crObj['REGION'][regionItem].y;
                    }
                } else if(crObj['REGION'][regionItem].y > 0) {
                    if(crObj['REGION'][regionItem].y > regionDimension['y'][1]) {
                        regionDimension['y'][1] = crObj['REGION'][regionItem].y;
                    }
                }


                var newX = crObj['REGION'][regionItem].x;
                var newY = crObj['REGION'][regionItem].y;

                var currentX = (newX * 64) + (32 * newY) - 32;
                var currentY = -(48 * newY);
                mapImages += '<div id="region_' + newX + '_' + newY + '" data-region="' + regionItem + '" style="left:' + currentX + 'px; top:' + currentY + 'px">';
                mapImages += '  <img alt="" src="img/' + mapTileName + '">';
                mapImages += '<span>';
                mapImages += crObj['REGION'][regionItem].Name ? crObj['REGION'][regionItem].Name + '<br>(' + newX + ',' + newY + ')' : '';
                mapImages += '</span>';
                mapImages += '</div>';
            }
        }
        $regions.html(mapImages);
        var offsetY = 32 + (Math.abs(regionDimension['y'][0]) * 64);
        var offsetX = 233 + (Math.abs(regionDimension['x'][0]) ) * 64;
        $regions.css({'margin-top': offsetY + 'px', 'margin-left': offsetX + 'px'});
        $trigger.trigger('mapReady');
    };

    /**
     * parseCR
     */
    var parseCR = function() {
        var blockValue = [];
        var regionBlockId = '';
        var regionBlockName = '';
        var blockId = '';
        var blockName = '';
        var subBlockName = '';
        var lineCounter = 0;

        crObj = {};

        $(crData).each(function(i, e) {

            // Block erkennen
            if(e.match(/^[a-z]/i)) {
                blockValue = e.split(' ');

                switch(blockValue.length) {
                    case 1: // Sub Block
                        // console.log('Sub Block ->', blockValue );
                        subBlockName = blockValue[0].trim();
                        lineCounter++;
                        break;

                    case 2: // Block
                        // console.log('Block->', blockValue );
                        // // Neuen Block im Block Typ blockName anlegen
                        blockId = 'id' + blockValue[1];
                        blockName = blockValue[0];
                        subBlockName = '';
                        lineCounter++;
                        break;

                    case 3: // Regions-Block
                        // console.log('  --  Regions-Block ->', blockValue );

                        blockValue[0] = blockValue[0].trim();
                        blockValue[1] = blockValue[1].trim();
                        blockValue[2] = blockValue[2].trim();

                        regionBlockName = blockValue[0];

                        // Einmalig neuen Block Typ anlegen
                        if(crObj[regionBlockName] == undefined) {
                            crObj[regionBlockName] = {};
                        }

                        regionBlockId = 'id' + blockValue[1] + blockValue[2];
                        blockId = '';
                        blockName = '';
                        subBlockName = '';

                        // Neuen Block im Block Typ blockName anlegen
                        crObj[regionBlockName][regionBlockId] = {};
                        // Koordinaten hinzufügen
                        crObj[regionBlockName][regionBlockId].x = Number(blockValue[1]);
                        crObj[regionBlockName][regionBlockId].y = Number(blockValue[2]);
                        lineCounter++;
                        break;

                }

            } else {
                var attribut = e.split(';');
                attribut[0] = attribut[0].trim().replace(/"/g, '');
                if(attribut.length > 1) {
                    attribut[1] = attribut[1].trim().replace(/"/g, '');
                }

                if(regionBlockName == 'REGION') {

                    // Region Infos

                    if(blockId == '' && blockName == '' && subBlockName == '') {
                        crObj[regionBlockName][regionBlockId][attribut[1]] = attribut[0];
                        lineCounter++;
                    }

                    if(blockId != '' && blockName != '' && subBlockName == '') {
                        if(blockName == 'BURG') {
                            if(crObj[regionBlockName][regionBlockId]['BURG'] == undefined) {
                                crObj[regionBlockName][regionBlockId]['BURG'] = {};
                            }
                            if(crObj[regionBlockName][regionBlockId]['BURG'][blockId] == undefined) {
                                crObj[regionBlockName][regionBlockId]['BURG'][blockId] = {};
                            }
                            crObj[regionBlockName][regionBlockId]['BURG'][blockId][attribut[1]] = attribut[0];
                            lineCounter++;
                        }
                        if(blockName == 'RESOURCE') {
                            if(crObj[regionBlockName][regionBlockId]['RESOURCE'] == undefined) {
                                crObj[regionBlockName][regionBlockId]['RESOURCE'] = {};
                            }
                            if(crObj[regionBlockName][regionBlockId]['RESOURCE'][blockId] == undefined) {
                                crObj[regionBlockName][regionBlockId]['RESOURCE'][blockId] = {};
                            }
                            crObj[regionBlockName][regionBlockId]['RESOURCE'][blockId][attribut[1]] = attribut[0];
                            lineCounter++;
                        }
                        if(blockName == 'MESSAGE') {
                            if(crObj[regionBlockName][regionBlockId]['MESSAGE'] == undefined) {
                                crObj[regionBlockName][regionBlockId]['MESSAGE'] = {};
                            }
                            if(crObj[regionBlockName][regionBlockId]['MESSAGE'][blockId] == undefined) {
                                crObj[regionBlockName][regionBlockId]['MESSAGE'][blockId] = {};
                            }
                            crObj[regionBlockName][regionBlockId]['MESSAGE'][blockId][attribut[1]] = attribut[0];
                            lineCounter++;
                        }
                        if(blockName == 'GRENZE') {
                            if(crObj[regionBlockName][regionBlockId]['GRENZE'] == undefined) {
                                crObj[regionBlockName][regionBlockId]['GRENZE'] = {};
                            }
                            if(crObj[regionBlockName][regionBlockId]['GRENZE'][blockId] == undefined) {
                                crObj[regionBlockName][regionBlockId]['GRENZE'][blockId] = {};
                            }
                            crObj[regionBlockName][regionBlockId]['GRENZE'][blockId][attribut[1]] = attribut[0];
                            lineCounter++;
                        }
                        if(blockName == 'EINHEIT') {
                            if(crObj[regionBlockName][regionBlockId]['EINHEIT'] == undefined) {
                                crObj[regionBlockName][regionBlockId]['EINHEIT'] = {};
                            }
                            if(crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId] == undefined) {
                                crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId] = {};
                            }
                            crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId][attribut[1]] = attribut[0];
                            lineCounter++;
                        }
                    }

                    if(subBlockName != '') {
                        if(subBlockName == 'TRANSLATION') {
                            if(crObj['TRANSLATION'] == undefined) {
                                crObj['TRANSLATION'] = {};
                            }
                            crObj['TRANSLATION'][attribut[1]] = attribut[0];
                            lineCounter++;
                        }
                        if(subBlockName == 'PREISE') {
                            if(crObj[regionBlockName][regionBlockId]['PREISE'] == undefined) {
                                crObj[regionBlockName][regionBlockId]['PREISE'] = {};
                            }
                            crObj[regionBlockName][regionBlockId]['PREISE'][attribut[1]] = attribut[0];
                            lineCounter++;
                        }
                        if(subBlockName == 'DURCHREISE') {
                            if(crObj[regionBlockName][regionBlockId]['DURCHREISE'] == undefined) {
                                crObj[regionBlockName][regionBlockId]['DURCHREISE'] = {};
                            }
                            crObj[regionBlockName][regionBlockId]['DURCHREISE'][attribut[1]] = attribut[0];
                            lineCounter++;
                        }
                        if(blockName == 'EINHEIT') {
                            if(subBlockName == 'COMMANDS') {
                                if(crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['COMMANDS'] == undefined) {
                                    crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['COMMANDS'] = [];
                                }
                                crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['COMMANDS'].push(attribut[0]);
                                lineCounter++;
                            }
                            if(subBlockName == 'TALENTE') {
                                if(crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['TALENTE'] == undefined) {
                                    crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['TALENTE'] = [];
                                }
                                crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['TALENTE'].push(attribut[0]);
                                lineCounter++;
                            }
                            if(subBlockName == 'SPRUECHE') {
                                if(crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['SPRUECHE'] == undefined) {
                                    crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['SPRUECHE'] = [];
                                }
                                crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['SPRUECHE'].push(attribut[0]);
                                lineCounter++;
                            }
                            if(subBlockName == 'GEGENSTAENDE') {
                                if(crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['GEGENSTAENDE'] == undefined) {
                                    crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['GEGENSTAENDE'] = [];
                                }
                                crObj[regionBlockName][regionBlockId]['EINHEIT'][blockId]['GEGENSTAENDE'][attribut[1]] = attribut[0];
                                lineCounter++;
                            }
                        }
                    }
                    if(blockName == 'MESSAGETYPE' && subBlockName == '') {
                        if(crObj['MESSAGETYPE'] == undefined) {
                            crObj['MESSAGETYPE'] = {};
                        }
                        if(crObj['MESSAGETYPE'][blockId] == undefined) {
                            crObj['MESSAGETYPE'][blockId] = {};
                        }
                        crObj['MESSAGETYPE'][blockId][attribut[1]] = attribut[0];
                        lineCounter++;
                    }

                } else {
                    // Meta Infos

                    if(blockName == 'MESSAGE') {
                        if(crObj['MESSAGE'] == undefined) {
                            crObj['MESSAGE'] = {};
                        }
                        if(crObj['MESSAGE'][blockId] == undefined) {
                            crObj['MESSAGE'][blockId] = {};
                        }
                        crObj['MESSAGE'][blockId][attribut[1]] = attribut[0];
                        lineCounter++;
                    }
                    if(blockName == 'VERSION') {
                        if(crObj['VERSION'] == undefined) {
                            crObj['VERSION'] = {};
                        }
                        if(crObj['VERSION'][blockId] == undefined) {
                            crObj['VERSION'][blockId] = {};
                        }
                        crObj['VERSION'][blockId][attribut[1]] = attribut[0];
                        lineCounter++;
                    }
                    if(blockName == 'COORDTRANS') {
                        if(crObj['COORDTRANS'] == undefined) {
                            crObj['COORDTRANS'] = {};
                        }
                        if(crObj['COORDTRANS'][blockId] == undefined) {
                            crObj['COORDTRANS'][blockId] = {};
                        }
                        crObj['COORDTRANS'][blockId][attribut[1]] = attribut[0];
                        lineCounter++;
                    }
                    if(blockName == 'PARTEI') {
                        if(crObj['PARTEI'] == undefined) {
                            crObj['PARTEI'] = {};
                        }
                        if(crObj['PARTEI'][blockId] == undefined) {
                            crObj['PARTEI'][blockId] = {};
                        }
                        if(subBlockName == '') {
                            crObj['PARTEI'][blockId][attribut[1]] = attribut[0];
                            lineCounter++;
                        } else if(subBlockName == 'OPTIONEN') {
                            if(crObj['PARTEI'][blockId]['OPTIONEN'] == undefined) {
                                crObj['PARTEI'][blockId]['OPTIONEN'] = {};
                            }
                            crObj['PARTEI'][blockId]['OPTIONEN'][attribut[1]] = attribut[0];
                            lineCounter++;
                        }
                    }
                    if(blockName == 'ZAUBER') {
                        if(crObj['ZAUBER'] == undefined) {
                            crObj['ZAUBER'] = {};
                        }
                        if(crObj['ZAUBER'][blockId] == undefined) {
                            crObj['ZAUBER'][blockId] = {};
                        }
                        if(subBlockName == '') {
                            crObj['ZAUBER'][blockId][attribut[1]] = attribut[0];
                            lineCounter++;
                        } else if(subBlockName == 'KOMPONENTEN') {
                            if(crObj['ZAUBER'][blockId]['KOMPONENTEN'] == undefined) {
                                crObj['ZAUBER'][blockId]['KOMPONENTEN'] = {};
                            }
                            crObj['ZAUBER'][blockId]['KOMPONENTEN'][attribut[1]] = attribut[0];
                            lineCounter++;
                        }

                    }
                }

            }

        });
        console.log(crObj, lineCounter);
        $trigger.trigger('crReady');
    };


    /**
     * getCrFromZip
     */
    var getCrFromZip = function(file) {
        zip.createReader(new zip.BlobReader(file), function(reader) {
            console.log(reader);
          // get all entries from the zip
          reader.getEntries(function(entries) {
            if (entries.length) {
              // get first entry content as text
                $(entries).each(function(i, e) {
                    if(e.filename.indexOf('.cr') != -1){
                        e.getData(new zip.TextWriter(), function(text) {
                          // text contains the entry data as a String
                          // close the zip reader
                            crData = text.split('\n');
                            $trigger.trigger('crLoaded');
                          reader.close(function() {
                            // onclose callback
                          });

                        }, function(current, total) {
                          // onprogress callback
                        });
                    }
                });
            }
          });
        }, function(error) {
          // onerror callback
        });
    };


    /**
     * prepareDragAndDrop
     */
    var prepareDragAndDrop = function() {
        document.addEventListener('drop', onDocumentDrop, false);
        document.addEventListener('dragover', function(event) {
            $dropInfo.show();
            event.stopPropagation();
            event.preventDefault();
            return false;
        }, false);

        var oFReader = new window.FileReader();
        /**
         * onDocumentDrop
         * @param {event} event - event
         */
        function onDocumentDrop(event) {
            $dropInfo.hide();
            event.stopPropagation();
            event.preventDefault();
            if(event.dataTransfer.files[0].name.indexOf('zip') != -1){
                getCrFromZip(event.dataTransfer.files[0]);
            }else{
                oFReader.readAsText(event.dataTransfer.files[0]);
            }
        }

        oFReader.onload = function(oFREvent) {
            crData = oFREvent.target.result.split('\n');
            $trigger.trigger('crLoaded');
        };
    };

    init();



    /**
     * depricated loadCR
     */
    var loadCR = function() {

        $.ajaxSetup({
            scriptCharset: 'utf-8',
            contentType: 'text/plain; charset=utf-8'
        });

        var crUrl;
        $.ajax({

            url: crUrl,

            dataType: 'text',
            type: 'get',

            success: function(response) {
                console.log('loadCR success:');
                crData = response.split('\n');
                $trigger.trigger('crLoaded');
            },

            error: function(a, b, c) {
                console.log('loadCR error:');
                console.log(a, b, c);
            }
        });
    };
};
