import { Component, OnInit } from '@angular/core';
import { ClusterSerializerXML } from '../cluster-serializer-xml';
import { Cluster } from '../cluster';

@Component({
  moduleId: module.id,
  selector: 'app-xml',
  templateUrl: 'xml.component.html',
  styleUrls: ['xml.component.css']
})
export class XmlComponent implements OnInit {

   private _cluster: Cluster;
   private _serializer: ClusterSerializerXML = new ClusterSerializerXML();

   constructor( aCluster: Cluster)
   {
      this._cluster = aCluster;
   }

  ngOnInit() {
  }

   public get xml(): string
   {
      if (this._cluster && this._cluster.numSystems)
      {
         this._serializer.cluster = this._cluster;
         return this._serializer.serialize();
      }
      else
         return "(no cluster)";
   }

}
