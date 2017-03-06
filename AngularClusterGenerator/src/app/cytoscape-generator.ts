import { Cluster } from './cluster';
import { StarSystem } from './star-system';

/**
 * Generates objects to drive Cytoscape.js (http://js.cytoscape.org/#core/initialisation).
 */
export class CytoscapeGenerator {

   public constructor( public cluster: Cluster) {}

   private _styleMap: Map<string, any> = new Map<string, any>();
   
   /**
    * Returns an object (an array of Cytoscape graph elements (nodes and edges)) suitable for use as the Cytoscape
    * 'elements' property (see http://js.cytoscape.org/#init-opts/elements).
    */
   public getElements(): any
   {
      let retval = { nodes: [], edges: []};
      for (let sys of this.cluster.systems)
      {
         retval.nodes.push( {data: {id: sys.id, label: sys.name}, classes: "t0e0r0"});
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
    * Ensure a style for the given system type exists (probably based on tech, environment and resources).
    */
   private ensureStyle( aSys: StarSystem): void
   {
      let sig = this.signature( aSys);
      if (this._styleMap.has( sig))
         return;

      let doubleBox = this.doubleBox( null); // TODO: not null, but a system signature. (TER-tuple, probably).
      let imageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="43" height="23">${doubleBox}</svg>`;
      let style = { width: 43, height: 23, 'background-image': `data:image/svg+xml,${imageSvg}` };
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

   /**
    * Returns SVG for the empty double-box part of the icon for the star system.  Will probably be offset vertically to
    * account for the "tech" stripes above or below it.
    */
   private doubleBox( aSys: StarSystem): string
   {
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
      return "";
   }

   /**
    * Similar to environmentBoxContents but for the resource value.
    */
   private resourceBoxContents( aSys: StarSystem): string
   {
      return "";
   }

   /**
    * Returns SVG showing the stripes indicating a system tech level.  Low stripes for low tech and high stripes for
    * high tech.
    */
   private techStrips( aSys: StarSystem): string
   {
      return "";
   }

   /**
    * Returns an object suitable for use as the Cytoscape 'style' property
    * (see http://js.cytoscape.org/#init-opts/style).
    */
   public getStyles(): any
   {
      let doubleBox = this.doubleBox( null); // TODO: not null, but a system signature. (TER-tuple, probably).

      // Basic node, edge styles:
      
      let retval: Array<any> = [
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
               'line-color': 'hsl(240, 100%, 80%)',
               'curve-style': 'bezier', // Just in case we have two slipstreams between the same two systems.
               'control-point-step-size': 20,
               'source-label': '+',
               'target-label': '-',
               'source-text-offset': 10,
               'target-text-offset': 10,
            }
         }
      ];

      // System-signature-specific styles:
      
      retval.push({
         selector: 'node.t0e0r0',
         style: {
            width: 43,
            height: 23,
            'background-image': `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="43" height="23">${doubleBox}</svg>`
         }
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
}

