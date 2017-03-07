import { Cluster } from './cluster';
import { StarSystem } from './star-system';

/**
 * Generates objects to drive Cytoscape.js (http://js.cytoscape.org/#core/initialisation).
 */
export class CytoscapeGenerator {

   public constructor( public cluster: Cluster) {}

   private _styleMap: Map<string, any> = new Map<string, any>();

   /**
    * Required initialization call to ensure that all styles necessary to render the cluster have been created.  (Note:
    * not including this in getElements() so we don't have to rely on it as a side effect of that call.
    */
   public ensureStyles(): void
   {
      for (let sys of this.cluster.systems) // TODO: probably better not to call this method
      {
         this.ensureStyle( sys);
      }
   }

   /**
    * Returns an object (an array of Cytoscape graph elements (nodes and edges)) suitable for use as the Cytoscape
    * 'elements' property (see http://js.cytoscape.org/#init-opts/elements).
    */
   public getElements(): any
   {
      let retval = { nodes: [], edges: []};
      for (let sys of this.cluster.systems) // TODO: probably better not to call this method
      {
         let signature = this.signature( sys);
         retval.nodes.push( {data: {id: sys.id, label: sys.name}, classes: signature});
      }

      for (let slipstream of this.cluster.slipstreams)
      {
         retval.edges.push( {data: {id: `${slipstream.from.id}-${slipstream.to.id}`,
                                              source: slipstream.from.id,
                                              target: slipstream.to.id }});
                                              
      }
      return retval;
   }

   /**
    * Returns an object suitable for use as the Cytoscape 'style' property
    * (see http://js.cytoscape.org/#init-opts/style).
    */
   public getStyles(): any
   {
      let doubleBox = this.doubleBox( null); // TODO: not null, but a system signature. (TER-tuple, probably).

      // Basic node, edge styles:
      
      let retval: Array<any> = this.basicStyles();

      // System-signature-specific styles:
      
      this._styleMap.forEach(
         function( value: any, key: string)
         {
            retval.push({
               selector: `node.${key}`,
               style: value
            });
         });

      // Cytoscape assigns styles in strict first-to-last order, so styles that need to take precedence (like the
      // :selected style) need to occur later in the styles array.
      retval.push({
         selector: 'node:selected',
         style: {
            'background-color': 'cyan',
            'background-opacity': 1
         }
      });

      return retval;
   }

   /**
    * Ensure a style for the given system type exists (probably based on tech, environment and resources).
    */
   private ensureStyle( aSys: StarSystem): void
   {
      let sig = this.signature( aSys);
      if (this._styleMap.has( sig))
         return;

      let envContents = this.environmentBoxContents( aSys);
      let resContents = this.resourceBoxContents( aSys);
      let doubleBox = this.doubleBox( aSys);
      let techStripes = this.techStripes( aSys);
      let imageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="43" height="31">`
         + envContents
         + resContents
         + doubleBox
         + techStripes
         + `</svg>`;
      let style = { width: 43, height: 31, 'background-image': `data:image/svg+xml,${imageSvg}` };
      this._styleMap.set( sig, style);
   }

   /**
    * Returns a "characteristic string" (or a "signature") of the given star system, suitable for use in determining
    * whether a style for a system of this type already exists.
    */
   private signature( aSys: StarSystem): string
   {
      return `T${aSys.tech}E${aSys.environment}R${aSys.resources}`;
   }

   private basicStyles(): Array<any>
   {
      let retval = [
         {
            selector: 'node',
            style: {
               label: 'data(label)',
               'background-opacity': 0,
               width: 43,
               height: 80,   // TODO: make this max possible height of an actual icon.
               shape: 'rectangle',
               'background-fit': 'none'
            }
         },
         {
            selector: 'edge',
            style: {
               'line-color': 'hsl(240, 0%, 75%)',
               'curve-style': 'bezier', // Just in case we have two slipstreams between the same two systems.
               'control-point-step-size': 20,
               'source-label': '+',
               'target-label': '-',
               'source-text-offset': 10,
               'target-text-offset': 10,
            }
         }
      ];

      return retval;
   }

   /**
    * Returns SVG for the empty double-box part of the icon for the star system.  Will probably be offset vertically to
    * account for the "tech" stripes above or below it.
    */
   private doubleBox( aSys: StarSystem): string
   {
      // 20x40, starting at (1,1), stroke-width 3 (so the strokes don't get clipped)
      let retval = `<path fill="none" stroke="black" stroke-width="3" d="M 1,21 v -20 h 40 v 20 z M 21,1 v 20"/>`;
      return retval;
   }

   /**
    * Returns SVG showing the contents of the "environment" box of the icon.  This will be something like nothing (empty
    * string for an E0 system) or a red geometry (for negative environment values) or a blue geometry (for positive
    * environment values).  The geometries will be: triangle, half-fill, "negative" triangle.
    */
   private environmentBoxContents( aSys: StarSystem): string
   {
      if (aSys.environment == 0)
         return ""; // No contents.

      let color: string;
      if (aSys.environment < 0)
         color = "red";
      else
         color = "hsl(220, 100%, 60%)";
      
      let path: string;
      let absEnv = Math.abs( aSys.environment);
      switch (absEnv)
      {
      case 1:
         path = `M 1,1 h 20 l -10,10 z`;
         break;
      case 2:
         path = `M 1,1 h 20 v 10 h -20 z`;
         break;
      case 3:
         path = `M 1,1 h 20 v 20 l -10,-10 l -10,10 z`;
         break;
      case 4:
         path = `M 1,1 h 20 v 20 h -20 z`;
         break;
      default:
         throw `Unexpected environment value (${aSys.environment})`;
      }
      
      let retval = `<path fill="${color}" d="${path}"/>`;
      return retval;
   }

   /**
    * Similar to environmentBoxContents but for the resource value.
    */
   private resourceBoxContents( aSys: StarSystem): string
   {
      if (aSys.resources == 0)
         return ""; // No contents.

      let color: string;
      if (aSys.resources < 0)
         color = "hsl(0, 0%, 40%)"; // gray
      else
         color = "hsl(45, 100%, 50%)"; // gold
      
      let path: string;
      let absRes = Math.abs( aSys.resources);
      switch (absRes)
      {
      case 1:
         path = `M 21,21 h 20 l -10,-10 z`;
         break;
      case 2:
         path = `M 21,21 h 20 v -10 h -20 z`;
         break;
      case 3:
         path = `M 21,21 h 20 v -20 l -10,10 l -10,-10 z`;
         break;
      case 4:
         path = `M 21,21 h 20 v -20 h -20 z`;
         break;
      default:
         throw `Unexpected resources value (${aSys.resources})`;
      }
      
      let retval = `<path fill="${color}" d="${path}"/>`;
      return retval;
   }

   /**
    * Returns SVG showing the stripes indicating a system tech level.  Low stripes for low tech and high stripes for
    * high tech.
    */
   private techStripes( aSys: StarSystem): string
   {
      let retval: string;
      let path = "M 0,30 h 42";
      retval = `<path fill="none" stroke="black" stroke-width="3" stroke-dasharray="6 6" d="${path}"/>`;
      return retval;
   }

}

