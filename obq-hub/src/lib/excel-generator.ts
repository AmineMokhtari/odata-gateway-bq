/**
 * Copyright 2026 Amine MOKHTARI
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Generates an Office Data Connection (.odc) file for an OData feed.
 * This allows "One-Click to Excel" functionality.
 */
export function downloadODataODC(url: string, tableName: string = 'BigQuery_Data') {
  const odcContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns:odc="urn:schemas-microsoft-com:office:odc">
<head>
<meta http-equiv=Content-Type content="text/x-ms-odc; charset=utf-8">
<meta name=ProgId content=ODC.ODataFeed>
<meta name=SourceType content=ODataFeed>
<title>${tableName}</title>
<xml id=docprops>
 <o:DocumentProperties
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns="http://www.w3.org/TR/REC-html40">
  <o:Name>${tableName}</o:Name>
 </o:DocumentProperties>
</xml>
<xml id=msodc>
 <odc:OfficeDataConnection
  xmlns:odc="urn:schemas-microsoft-com:office:odc"
  xmlns="http://www.w3.org/TR/REC-html40">
  <odc:Connection odc:Type="ODataFeed">
   <odc:ConnectionString>Data Source=${url};Namespaces to Include=*;Max Received Message Size=4398046511104;Runtime Stored Procedure Management=false;Check Online for Schema=false</odc:ConnectionString>
   <odc:CommandText>${url}</odc:CommandText>
  </odc:Connection>
 </odc:OfficeDataConnection>
</xml>
</head>
</html>
`.trim();

  const blob = new Blob([odcContent], { type: 'text/x-ms-odc' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${tableName}.odc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
