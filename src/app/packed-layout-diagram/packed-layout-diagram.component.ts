import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';
import * as go from 'gojs';
import { DataSyncService, DiagramComponent } from 'gojs-angular';
//import { PackedLayout } from 'gojs/extensionsTS/PackedLayout';
import { PackedLayout } from 'gojs/extensionsTS/PackedLayout';

@Component({
  selector: 'app-packed-layout-diagram',
  templateUrl: './packed-layout-diagram.component.html',
  styleUrls: ['./packed-layout-diagram.component.css']
})
export class PackedLayoutDiagramComponent implements OnInit {

  @ViewChild('myDiagram', { static: true })
  public myDiagramComponent: DiagramComponent;
  @Input() appGroupColor: string;
  @Input() diagramModelDataInput: go.ObjectData;
  @Input() diagramNodeDataInput: Array<go.ObjectData>;
  showLegends = false;
  legendsDisplayed = false;
  @Input() legends;
  //@ViewChild('myDiagramDiv') myDiagramDiv: ElementRef;

  @ViewChild('myDiagramDiv')
  private linkElement;

  // initialize diagram / templates
  public initDiagram() {
    let isGridLayout=false;
    const $ = go.GraphObject.make;
    let strokeWidth = 1;
    const isSubGraphExpanded = true;
    const textBlockHeight = 35;
    const shapeKeyword = 'SHAPE';
    const textKeyword = 'TEXT';

    const dia = $(go.Diagram, {
      'undoManager.isEnabled': true,
      'draggingTool.isEnabled': false,
      contentAlignment: go.Spot.TopLeft, // to align the content on top left/center
      initialAutoScale: go.Diagram.UniformToFill, // fit to window - go.Diagram.Uniform, //fit to rect - UniformToFill
      model: $(go.GraphLinksModel,
        {
          linkToPortIdProperty: 'toPort',
          linkFromPortIdProperty: 'fromPort',
          linkKeyProperty: 'key' // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
        }
      )
    });

    dia.commandHandler.archetypeGroupData = { key: 'Group', isGroup: true };

        // dia.toolManager.hoverDelay = 100;
    //dia.zoomToRect( dia.documentBounds, go.Diagram.UniformToFill );

    // var myToolTip = $(go.HTMLInfo, {
    //   show: showToolTip,
    //   // do nothing on hide: This tooltip doesn't hide unless the mouse leaves the diagram
    // });

    function makeLayout(parentGroupItem: boolean) {  // a Binding conversion function
      // if (parentGroupItem) {
      //   return $(go.GridLayout, {
      //     //wrappingColumn: dia.model.modelData.level1wrappingColumnCount,
      //     wrappingColumn: NaN,
      //     wrappingWidth: Infinity,
      //     alignment: go.GridLayout.Position,
      //     cellSize: new go.Size(1, 1),
      //     spacing: new go.Size(8, 8)
      //   });
      // } else {

      //   if (dia.model.modelData.level2WrappingColumnCount > 0) {
      //     return $(go.GridLayout, {
      //       //wrappingColumn: dia.model.modelData.level2WrappingColumnCount,
      //       wrappingColumn: NaN,
      //       alignment: go.GridLayout.Position,
      //       cellSize: new go.Size(1, 1),
      //       spacing: new go.Size(8, 8)
      //     });
      //   } else {
      //     return $(go.GridLayout, {

      //       wrappingColumn: Infinity,
      //       alignment: go.GridLayout.Position,
      //       cellSize: new go.Size(1, 1),
      //       spacing: new go.Size(8, 8)
      //     });
      //   }
      // }
      return $(PackedLayout,
        //{
        //  spacing: 10,
        //  sortMode: PackedLayout.None,
        //  packMode: PackedLayout.ExpandToFit
        //}
        // /////// correct view but order was backwards need to check Mode:: *aspectRatio*
        {
          //packMode: PackedLayout.AspectRatio,
          packShape: PackedLayout.Rectangular,
          // sortMode: PackedLayout.area,
          //sortOrder: PackedLayout.Ascending,
          aspectRatio: 2,
          size: new go.Size(10, 10),
          spacing: 10,
          hasCircularNodes: false,
          arrangesToOrigin: true
        }

        // /////// correct view but width not adjusted fit mode
        // {
        //   packMode: PackedLayout.fit,
        //   packShape: PackedLayout.Rectangular,
        //   sortMode: PackedLayout.area,
        //   sortOrder: PackedLayout.Ascending,
        //   aspectRatio: 1,
        //   size: new go.Size(600, 600),
        //   spacing: 10,
        //   hasCircularNodes: false,
        //   arrangesToOrigin: false
        // }
      );
    }


    dia.toolManager.hoverDelay = 100;
    dia.defaultCursor = 'pointer';

    function viewDetail(e, obj) {

      alert(obj.part.adornedPart.data.text);
    }

    function mouseEntergrp(e, obj) {
      if (dia.model.modelData.levelHoverEnabled) {
        dia.nodes.each(n => n.opacity = ((n.key === obj.nb.key) || obj.nb.key === n.data.group || obj.nb.group === n.key) ? 1.0 : 0.2);
      }
    }


    function mouseLeavegrp(e, obj) {
      dia.nodes.each(n => n.opacity = 1.0);
    }

    function mouseEnter(e, obj) {
      if (dia.model.modelData.nodeHoverEnabled) {
        dia.nodes.each(n => n.opacity = ((n.key === obj.nb.key) || n.key === obj.nb.group) ? 1.0 : 0.2);
      }
    }

    function mouseLeave(e, obj) {
      dia.nodes.each(n => n.opacity = 1.0);
    }
    let enabledWidth = false;
    setTimeout(() => {
      enabledWidth = dia.model.modelData.widthEnabled;
    }, 100);
    setTimeout(() => {
    dia.groupTemplate =
      $(go.Group, 'Auto',
        {
          mouseEnter: mouseEntergrp,
          mouseLeave: mouseLeavegrp,
          background: 'transparent',
          ungroupable: true,
          isSubGraphExpanded: isSubGraphExpanded,
          // Groups containing Groups lay out their members horizontally
          layout: makeLayout(false)
        },
        new go.Binding('layout', 'parentGroupItem', makeLayout),

        dia.model.modelData.width > 0 ? new go.Binding('width', 'parentGroupItem', function (g) { return g ? dia.model.modelData.width : (dia.model.modelData.width / dia.model.modelData.level1wrappingColumnCount) - 20; }) : '',
        new go.Binding('background', 'isHighlighted', function (h) {
          return h ? 'rgba(255,0,0,0.2)' : 'transparent';
        }).ofObject(),
        $(go.Shape, 'Rectangle',
          { parameter1: 14, fill: '#fff', strokeWidth: strokeWidth, name: shapeKeyword },
          new go.Binding('strokeWidth', 'parentGroupItem', function (parentGroupItem) { return parentGroupItem ? dia.model.modelData.strokeWidth : dia.model.modelData.strokeWidth; }),


          new go.Binding('fill', 'parentGroupItem', function (parentGroupItem, obj) {
            console.log(obj.part.nb.fillColor);
            return obj.part.nb.fillColor ? obj.part.nb.fillColor : ((parentGroupItem) ? dia.model.modelData.groupFillColor : dia.model.modelData.childGroupFillColor);
          }),

          new go.Binding('stroke', 'parentGroupItem', function (parentGroupItem, obj) {
            return obj.part.nb.color ? obj.part.nb.color : ((parentGroupItem) ? dia.model.modelData.groupColor : dia.model.modelData.childGroupCOlor);
          }),
        ),
        $(go.Panel, 'Vertical',  // title above Placeholder
          { stretch: go.GraphObject.Horizontal },
          $(go.Panel, 'Table',  // button next to TextBlock Horizontal or Table
            { stretch: go.GraphObject.Horizontal, height: 50 },
            new go.Binding('height', 'parentGroupItem', function (parentGroupItem, obj) {
              return obj.part.ob.height; // height configured from the data level itself
            }),
            new go.Binding('background', 'parentGroupItem', function (parentGroupItem, obj) {
                return obj.part.ob.color ? obj.part.ob.color : ((parentGroupItem) ? dia.model.modelData.groupColor : dia.model.modelData.childGroupCOlor);
            }),
            // color have issue so decleared same color
          //   new go.Binding('background', 'parentGroupItem', function (parentGroupItem, obj) {
          //     return '#b41f47'
          // }),
            $('SubGraphExpanderButton',
              { alignment: go.Spot.Left, margin: 5 }),
            $(go.TextBlock,
              {
                // verticalAlignment: go.Spot.Center,
                editable: false,
                margin: new go.Margin(15, 5, 0, 30),
                font: '18px sans-serif',
                stroke: 'white',
                name: textKeyword,
                columnSpan: 4,
                height: textBlockHeight,
                overflow: go.TextBlock.OverflowEllipsis,
                textAlign: 'left', // 'start' | 'end' | 'left' | 'right' | 'center',
                alignment: go.Spot.Center
              },
              new go.Binding('font', 'parentGroupItem', function (parentGroupItem) { return parentGroupItem ? dia.model.modelData.parentGroupFont : dia.model.modelData.childrenGroupFont; }),
              new go.Binding('stroke', 'parentGroupItem', function (parentGroupItem) { return parentGroupItem ? dia.model.modelData.parentGroupTextColor : dia.model.modelData.childrenGroupTextColor; }),
              new go.Binding('text', 'text').makeTwoWay()),
            {
              toolTip:  // define a tooltip for each node that displays the color as text
                $('ToolTip',
                  $(go.TextBlock, { margin: 4 },
                    new go.Binding('text', 'text'))
                )  // end of Adornment
            }
          ),  // end Horizontal Panel
          $(go.Placeholder,
            { padding: 10, alignment: go.Spot.Center },
          )
        )  // end Vertical Panel
        );
    }, 200);
    let myLastClick = 0;
    // define the Node template
    dia.nodeTemplate =

      $(go.Node, 'Auto',
        {
          desiredSize: new go.Size(140, 70), // To set the size of node (150,70)
          mouseEnter: mouseEnter,
          mouseLeave: mouseLeave,
          doubleClick: function (e, node) {
            //myLastClick = e.timestamp;
            //console.log(node['nb']);
          },
        },

        $(go.Shape, 'RoundedRectangle',
          { fill: '#fff', strokeWidth: strokeWidth, name: 'SHAPE' },
          new go.Binding('stroke', 'color', function (color, obj) { return obj.part.nb.color  ? obj.part.nb.color : dia.model.modelData.nodeColor; }),
          new go.Binding('fill', 'color', function (color, obj) { return obj.part.nb.fillColor ? obj.part.nb.fillColor : dia.model.modelData.nodeFillColor; }),
        ),

        $(go.TextBlock,
          {
            margin: 5,
            font: '16px sans-serif',
            stroke: 'white',
            name: textKeyword,
            alignment: go.Spot.Center,
            overflow: go.TextBlock.OverflowEllipsis,
            text: 'alignment: Center',
          },

          // new go.Binding('stroke', 'color', function (color, obj) { return obj.part.nb.textColor ? obj.part.nb.textColor : dia.model.modelData.nodeTextColor ? dia.model.modelData.nodeTextColor : 'white'; }),
          new go.Binding('stroke', 'color', function (color, obj) { return 'black' }),

          new go.Binding('font', 'text', function (text) { return dia.model.modelData.nodeTextFont ? dia.model.modelData.nodeTextFont : '16px sans-serif'; }),
          new go.Binding('text', 'text').makeTwoWay()),
        {
          contextMenu:     // define a context menu for each node
            $('ContextMenu',  // that has one button
              $('ContextMenuButton',
                $(go.TextBlock, 'View Detail'),
                { click: viewDetail })
              // more ContextMenuButtons would go here
            )  // end Adornment
        },
        {
          toolTip:  // define a tooltip for each node that displays the color as text
            $('ToolTip',
              $(go.TextBlock, { margin: 4 },
                new go.Binding('text', 'text'))
            )  // end of Adornment
          }
      );

    return dia;

    // function mouseEntergrp(e, obj) {
    //   var shape = obj.findObject('SHAPE');
    //   //console.log(shape);
    //   if (obj.lb.parentGroupItem == true) {
    //     shape.fill = dia.model.modelData.groupHoverColor;
    //     shape.stroke = dia.model.modelData.groupHoverColor;
    //   } else {
    //     shape.fill = dia.model.modelData.childGroupHoverCOlor;
    //     shape.stroke = dia.model.modelData.childGroupHoverCOlor;
    //   }
    //   var text = obj.findObject('TEXT');
    //   text.stroke = 'white';
    // }

    // function mouseEnter(e, obj) {
    //   dia.nodes.each(
    //     (n) =>
    //       (n.opacity =
    //         n.key === obj.lb.key || n.key === obj.lb.group ? 1.0 : 0.2)
    //   );
    //   showToolTip(obj, dia);
    // }

    // function mouseLeave(e, obj) {
    //   dia.nodes.each((n) => (n.opacity = 1.0));
    //   hideToolTip(obj, dia);
    // }

    // function hideToolTip(obj, diagram) {
    //   var node = obj.part;
    //   var e = diagram.lastInput;
    //   var infoBox = document.getElementById('infoBox');
    //   var elem = document.elementFromPoint(e.viewPoint.x, e.viewPoint.y);
    //   if (elem !== null && (elem === infoBox || elem.parentNode === infoBox)) {
    //     var box = document.getElementById('infoBoxHolder');
    //     //box.style.left = parseInt(box.style.left) + 'px';
    //     //box.style.top = parseInt(box.style.top) + 30 + 'px';
    //   } else {
    //     var box = document.getElementById('infoBoxHolder');
    //     box.innerHTML = '';
    //   }
    // }

    // function showToolTip(obj, diagram) {
    //   var node = obj.lb;
    //   var e = diagram.lastInput;
    //   console.log(obj);
    //   updateInfoBox(e.viewPoint, node);
    // }

    // function updateInfoBox(mousePt, data) {
    //   console.log(data);
    //   var box = document.getElementById('infoBoxHolder');
    //   box.innerHTML = '';
    //   var infobox = document.createElement('div');
    //   infobox.id = 'infoBox';
    //   box.appendChild(infobox);
    //   for (var i = 0; i < 9; i++) {
    //     var child = document.createElement('div');
    //     switch (i) {
    //       case 0:
    //         child.textContent = data.text;
    //         break;
    //       case 1:
    //         child.className = 'infoTitle';
    //         child.textContent = 'Sepal Length';
    //         break;
    //       case 2:
    //         child.className = 'infoValues';
    //         child.textContent = '3';
    //         break;
    //       case 3:
    //         child.className = 'infoTitle';
    //         child.textContent = 'Sepal Width';
    //         break;
    //       case 4:
    //         child.className = 'infoValues';
    //         child.textContent = '1';
    //         break;
    //       // case 5:
    //       //   child.className = 'infoTitle';
    //       //   child.textContent = 'Petal Length';
    //       //   break;
    //       // case 6:
    //       //   child.className = 'infoValues';
    //       //   child.textContent = data.petalLength;
    //       //   break;
    //       // case 7:
    //       //   child.className = 'infoTitle';
    //       //   child.textContent = 'Petal Width';
    //       //   break;
    //       // case 8:
    //       //   child.className = 'infoValues';
    //       //   child.textContent = data.petalWidth;
    //       //   break;
    //     }
    //     infobox.appendChild(child);
    //   }
    //   box.style.left = mousePt.x + 5 + 'px';
    //   box.style.top = mousePt.y + 50 + 'px';
    // }

    // function singleClick(e, obj) {
    //   if (e.clickCount === 1) {
    //     const time = e.timestamp;
    //     myLastClick = time;
    //     setTimeout(function () {
    //       if (myLastClick === time) {
    //         alert('clicked');
    //         // need to access router or constructor defined service here
    //       }
    //     }, 500);
    //   }
    // }

    // function doubleClick(e, obj) {
    //   myLastClick = e.timestamp;
    //   console.log(obj.nb);
    //   alert('Double Clicked :  ' + obj.nb.text);
    // }

    // dia.groupTemplate = $(
    //   go.Group,
    //   'Vertical',
    //   {
    //     layout: $(go.TreeLayout, {
    //       setsPortSpot: false,
    //       setsChildPortSpot: false,
    //     }),
    //   },
    //   { defaultStretch: go.GraphObject.Horizontal },
    //   { fromSpot: go.Spot.RightSide, toSpot: go.Spot.LeftSide },
    //   $(
    //     go.Panel,
    //     'Auto',
    //     $(
    //       go.Shape,
    //       'Rectangle',
    //       { fill: 'white' },
    //       new go.Binding('fill', 'role', function (r) {
    //         return r[0] === 't' ? 'lightgray' : 'white';
    //       })
    //     ),
    //     $(
    //       go.TextBlock,
    //       { margin: new go.Margin(2, 2, 0, 2), textAlign: 'center' },
    //       new go.Binding('text', 'header')
    //     )
    //   ),
    //   $(
    //     go.Panel,
    //     'Auto',
    //     $(go.Shape, { fill: 'white' }),
    //     $(go.Placeholder, { padding: 20 }),
    //     $(
    //       go.Shape,
    //       'RoundedRectangle',
    //       {
    //         visible: false,
    //         width: 10,
    //         height: 10,
    //         alignment: new go.Spot(0.5, 1, 0, -3),
    //         alignmentFocus: go.Spot.Bottom,
    //       },
    //       new go.Binding('visible', 'loop')
    //     )
    //   )
    // );
    // let myLastClick = 0;
    // // define the Node template
    // dia.nodeTemplate = $(
    //   go.Node,
    //   'Auto',
    //   {
    //     // dropping on a Node is the same as dropping on its containing Group, even if it's top-level
    //     //mouseDrop: function(e, node) { finishDrop(e, node.containingGroup); },
    //     desiredSize: new go.Size(150, 70), // To set the size of node
    //     //mouseEnter: mouseEnter,
    //     mouseLeave: mouseLeave,
    //     click: singleClick,
    //     doubleClick: function (e, node) {
    //       myLastClick = e.timestamp;
    //       alert('Double Clicked : ' + node['nb'].text);
    //     },
    //   },
    //   $(
    //     go.Shape,
    //     'RoundedRectangle',
    //     { fill: '#14a0dc', stroke: null, name: 'SHAPE' },
    //     new go.Binding('fill', 'color', function (color) {
    //       return color ? color : dia.model.modelData.nodeColor;
    //     })
    //   ),
    //   $(
    //     go.TextBlock,
    //     {
    //       margin: 5,
    //       //padding:20,
    //       //editable: true,
    //       font: '16px sans-serif',
    //       //opacity: 0.75,
    //       stroke: 'white',
    //       name: 'TEXT',
    //       // width: 140,
    //       alignment: go.Spot.Center,
    //       //height: 60,
    //       overflow: go.TextBlock.OverflowEllipsis,
    //       //overflow: go.TextBlock.OverflowClip,
    //       //wrap: go.TextBlock.WrapFit,
    //       //text: "textAlign: 'Right'"
    //       text: 'alignment: Center',
    //     },
    //     new go.Binding('text', 'text').makeTwoWay()
    //   ),
    //   {
    //     // define a context menu for each node
    //     contextMenu: $(
    //       'ContextMenu', // that has one button
    //       $('ContextMenuButton', $(go.TextBlock, 'View Detail'), {
    //         click: viewDetail,
    //       })
    //       // more ContextMenuButtons would go here
    //     ), // end Adornment
    //   },
    //   // {
    //   //   toolTip: myToolTip,
    //   //   // define a tooltip for each node that displays the color as text
    //   //   // toolTip: $(
    //   //   //   'ToolTip',
    //   //   //   $(go.TextBlock, { margin: 4 }, new go.Binding('text', 'text'))
    //   //   // ) // end of Adornment
    //   // }
    // );

    // //dia.zoomToRect(dia.documentBounds, go.Diagram.UniformToFill);

    // return dia;
  }

  public diagramNodeData: Array<go.ObjectData> = [];
  public diagramDivClassName = 'myDiagramDiv';
  public skipsDiagramUpdate = false;

  public diagramModelData: go.ObjectData = {};

  // When the diagram model changes, update app data to reflect those changes
  public diagramModelChange = function (changes: go.IncrementalData) {
    // when setting state here, be sure to set skipsDiagramUpdate: true since GoJS already has this update
    // (since this is a GoJS model changed listener event function)
    // this way, we don't log an unneeded transaction in the Diagram's undoManager history
    this.skipsDiagramUpdate = true;
    this.diagramNodeData = DataSyncService.syncNodeData(changes, this.diagramNodeData);
    this.diagramLinkData = DataSyncService.syncLinkData(changes, this.diagramLinkData);
    this.diagramModelData = DataSyncService.syncModelData(changes, this.diagramModelData);
  };
  public dropdownSubscription;
  public modalSubscription;

  constructor(
    private cdr: ChangeDetectorRef,
    private httpClient: HttpClient,
    private renderer: Renderer2 //public router: Router
  ) {}

  async reloadDiagram(e) {
    this.myDiagramComponent.diagram.model.nodeDataArray = e.data;
    this.myDiagramComponent.diagram.model.modelData = e.modelData;
    this.showLegends = e.modelData.showLegends;

    if (this.legendsDisplayed !== e.modelData.showLegends) {
      await this.ShowHideLegends();
    }

    if (this.myDiagramComponent.diagram.model.modelData.fitType === 'Fit to Rect') {
      this.myDiagramComponent.diagram.zoomToRect(this.myDiagramComponent.diagram.documentBounds, go.Diagram.UniformToFill);
      this.myDiagramComponent.diagram.requestUpdate();
    } else {
      this.fitToScreen();
    }
    // this.myDiagramComponent.diagram.requestUpdate();
    // this.myDiagramComponent.diagram.model.commitTransaction('updated' );

  }


  public observedDiagram = null;

  // currently selected node; for inspector
  public selectedNode: go.Node | null = null;

  // // Overview Component testing
  // public oDivClassName = 'myOverviewDiv';
  // public initOverview(): go.Overview {
  //   const $ = go.GraphObject.make;
  //   const overview = $(go.Overview);
  //   return overview;
  // }
  // public observedDiagram = null;

  // // currently selected node; for inspector
  // public selectedNode: go.Node | null = null;

  ngOnInit() {
    // this.httpClient.get("assets/data.json").subscribe(data =>{
    //   console.log(data);
    //   //this.diagramNodeData = <go.ObjectData[]>data;
    // });

    // this.diagramModelData.groupColor = this.appGroupColor;
    // console.log(this.diagramNodeDataInput);
    // this.diagramModelData = this.diagramModelDataInput;
    // this.diagramNodeData = this.diagramNodeDataInput;
    this.diagramModelData = this.diagramModelDataInput;
    console.log(this.diagramNodeDataInput);
    this.diagramNodeData = this.diagramNodeDataInput;
    // condition added from the settings we don't have legends variable
    if (this.diagramModelData?.legends) {
      this.showLegends = this.diagramModelData.legends;
    } else {
      this.showLegends = false;
    }
  }

  public ngAfterViewInit() {
    if (this.observedDiagram) { return; }
    this.observedDiagram = this.myDiagramComponent.diagram;
    this.cdr.detectChanges(); // IMPORTANT: without this, Angular will throw ExpressionChangedAfterItHasBeenCheckedError (dev mode only)

    const appComp: PackedLayoutDiagramComponent = this;
    // for track single and double click
    let myLastClick = 0;
    // listener for inspector
    this.myDiagramComponent.diagram.addDiagramListener('ChangedSelection', function (e) {
      e.diagram.setInputOption('parentColor', 'red');
      if (e.diagram.selection.count === 0) {
        appComp.selectedNode = null;
      }
      const node = e.diagram.selection.first();
      if (node instanceof go.Node) {
        appComp.selectedNode = node;
      } else {
        appComp.selectedNode = null;
      }
    });

    // on node or group double click, trigger event
    this.myDiagramComponent.diagram.addDiagramListener('ObjectDoubleClicked', function (e) {
      //alert('double click');
      myLastClick = e.diagram.lastInput.timestamp;
      if (e.subject.Ui !== undefined && e.subject.Ui.Qa !== '') {
        // console.log('clicked button');
      } else {
        let isClickable = false;
        // const guidKey = appComp.myDiagramComponent.diagram.model.modelData.blockId + '' + e.subject.part.data.key;
        const queries = appComp.myDiagramComponent.diagram.model.modelData.queries;
        if (typeof queries[e.subject.part.data.level - 1] !== 'undefined') {
          if (queries[e.subject.part.data.level - 1].isClickableQueryEnabled && queries[e.subject.part.data.level - 1].clickableQuery !== '') {
            isClickable = true;
          }
        }
        if (e.subject.part.data.isGroup) {
          if (isClickable === true) {
            if (e.subject.part.data.level === 0) {
            } else {
            }
          }
        } else {
          if (e.subject.part.data?.guid) {
          }
        }
      }
    });

    // on node or group click, trigger event
    this.myDiagramComponent.diagram.addDiagramListener('ObjectSingleClicked', function (e) {
      // [GS] the below condition for handle single click or double click both case called this listener so we are validate here
      if (e.diagram.lastInput.clickCount === 1) {
        var time = e.diagram.lastInput.timestamp;
        myLastClick = time;
        setTimeout(function () {
          if (myLastClick === time) {
            if (e.subject.Ui !== undefined && e.subject.Ui.Qa !== '') {
               // console.log('clicked button');
            } else {
              let isClickable = false;
              const guidKey = appComp.myDiagramComponent.diagram.model.modelData.blockId + '' + e.subject.part.data.key;
              const queries = appComp.myDiagramComponent.diagram.model.modelData.queries;
              if (typeof queries[e.subject.part.data.level - 1] !== 'undefined') {
                if (queries[e.subject.part.data.level - 1].isClickableQueryEnabled && queries[e.subject.part.data.level - 1].clickableQuery !== '') {
                  isClickable = true;
                }
              }
              if (e.subject.part.data.isGroup) {
                if (isClickable === true) {
                  if (e.subject.part.data.level === 0) {
                  } else {
                  }
                }
              } else {
              }
            }
          }
        }, 500);
      }
    });

    // on screen size change, redraw landscape diagram
    // const fitToRect = 'Fit to rect';
    // this.myDiagramComponent.diagram.addDiagramListener('ViewportBoundsChanged', function (e) {
    //   setTimeout(() => {
    //     if ((e.diagram.div.clientHeight !== appComp.diagramHeight) || (appComp.diagramWidth !== e.diagram.div.clientWidth)) {
    //       appComp.diagramWidth = e.diagram.div.clientWidth;
    //       appComp.diagramHeight = e.diagram.div.clientHeight;
    //       if (appComp.myDiagramComponent.diagram.model.modelData.fitType === fitToRect) {
    //          appComp.myDiagramComponent.diagram.zoomToRect(appComp.myDiagramComponent.diagram.documentBounds, go.Diagram.UniformToFill);
    //       } else {
    //         appComp.fitToScreen();
    //       }
    //       appComp.myDiagramComponent.diagram.requestUpdate();
    //     }
    //   }, 300);
    // });
    return false;
  } // end ngAfterViewInit


  /**
  * Description: Fit the diagram to fill its full width in rect manner
  * Author: Ravi
  *
  * */
   fitToRectScreen() {
    setTimeout(() => {
      this.myDiagramComponent.diagram.zoomToRect(this.myDiagramComponent.diagram.documentBounds, go.Diagram.UniformToFill);
      this.myDiagramComponent.diagram.requestUpdate();
    }, 500);
  }


/**
 * Description: Fits the diagram to its height and width
 * Author: Ravi
 *
 * */
  fitToScreen() {
    setTimeout(() => {
        this.myDiagramComponent.diagram.commandHandler.zoomToFit();
      this.myDiagramComponent.diagram.requestUpdate();
    }, 200);
  }

  // fitToRectScreen() {
  //   this.myDiagramComponent.diagram.zoomToRect(
  //     this.myDiagramComponent.diagram.documentBounds,
  //     go.Diagram.UniformToFill
  //   );
  //   this.myDiagramComponent.diagram.requestUpdate();
  // }

  // fitToScreen() {
  //   this.myDiagramComponent.diagram.commandHandler.zoomToFit();
  //   this.myDiagramComponent.diagram.requestUpdate();
  // }

  maximize() {}

  ShowHideLegends() {
    var div = this.myDiagramComponent.diagram.div;

    if (this.legendsDisplayed) {
      this.showLegends = !this.showLegends;
      div.style.width = '1600px';
      this.legendsDisplayed = false;
    } else {
      div.style.width = '1000px';
      this.legendsDisplayed = true;
    }

    //this.renderer.setStyle(this.linkElement.nativeElement, "display", "none");

    //this.renderer.setStyle(this.myDiagramDiv.nativeElement, 'width', `1600px`);
    //console.log(this.myDiagramDiv.nativeElement);
    //this.renderer.setStyle(this.renderer.selectRootElement('.myDiagramDiv'), 'width', `1600px`);
    //this.myDiagramComponent.diagram.zoomToRect( this.myDiagramComponent.diagram.documentBounds, go.Diagram.UniformToFill );
    //this.myDiagramComponent.diagram.requestUpdate();
    //this.fitToRectScreen();
    setTimeout(() => {
      //alert();
      this.fitToRectScreen();

      if (this.legendsDisplayed) {
        this.showLegends = !this.showLegends;
      }
    }, 500);
  }

}