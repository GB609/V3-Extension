<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:xdt="http://www.w3.org/2005/xpath-datatypes" xmlns:xalan="http://xml.apache.org/xalan" xmlns:exsl="http://exslt.org/common"
    xmlns:gb="http://gb/v3/js"
    extension-element-prefixes="exsl">

    <xsl:output method="text" omit-xml-declaration="yes" indent="yes" xalan:indent-amount="4" />
    <xsl:strip-space elements="*" />

	<xsl:param name="rootDir" />
    <xsl:param name="scriptNamespace" />
    <xsl:param name="scriptName"/>
    <xsl:param name="scriptVersion"/>
    <xsl:param name="resPathAdjust" />
    <xsl:param name="includeUrls" />
    <xsl:param name="excludeUrls" />
    <xsl:param name="includeHeader" />
    
    <xsl:variable name="nl" select="string('&#xa;')" />
    
<xsl:variable name="headerEnd">
// @grant GM_info
// @grant GM.info
// @grant GM_getResourceText
// @grant GM.getResourceText
// @grant GM.getResourceUrl
// @run-at document-idle
// ==/UserScript==
</xsl:variable>

    <xsl:template match="/">

<xsl:if test="$includeHeader = 'true'">    
<xsl:text>// ==UserScript==</xsl:text>
<xsl:value-of select="concat($nl, '// @namespace ', $scriptNamespace)" />
<xsl:value-of select="concat($nl, '// @name ', $scriptName)" />
<xsl:value-of select="concat($nl, '// @version ', $scriptVersion)" />
<xsl:value-of select="gb:loadInclExcl()" />
<xsl:value-of select="gb:buildDependencies(.)" />
<xsl:value-of select="gb:buildResources()" />
<xsl:value-of select="$headerEnd" />
</xsl:if>
<xsl:value-of select="gb:assembleSource(concat('/js/', $scriptName, '.js'))" />

	</xsl:template>
	
	<xsl:function name="gb:assembleSource">
		<xsl:param name="srcFile"/>
		
		<xsl:variable name="source" select="gb:loadTextFile($srcFile)" />
		<xsl:analyze-string regex="(//\s*#include\s+([\S/]+))" select="$source">
			<xsl:matching-substring>
				<xsl:message>including file [<xsl:value-of select="regex-group(2)"/>]</xsl:message>
				<xsl:value-of select="gb:loadTextFile(concat('/js/', regex-group(2), '.js'))" />
			</xsl:matching-substring>
			<xsl:non-matching-substring>
				<xsl:value-of select="."/>
			</xsl:non-matching-substring>
		</xsl:analyze-string>
	</xsl:function>
	
    <xsl:function name="gb:loadTextFile">
        <xsl:param name="filePathRelative"/>
        <xsl:variable name="filePathAbs" select="concat('file:', $rootDir, $filePathRelative)" />
        <xsl:choose>
	        <xsl:when test="unparsed-text-available(string($filePathAbs), 'utf-8')">
	        	<xsl:message>Loading file [<xsl:value-of select="string($filePathAbs)" />]</xsl:message>
	        	<xsl:value-of select="unparsed-text(string($filePathAbs), 'utf-8')"></xsl:value-of>
	        </xsl:when>
	        <xsl:otherwise>
	        	<xsl:message>File [<xsl:value-of select="$filePathAbs" />] not found.</xsl:message>
	        </xsl:otherwise>
        </xsl:choose>
    </xsl:function>
    
    <xsl:function name="gb:buildDependencies"  xpath-default-namespace="http://graphml.graphdrawing.org/xmlns">
    	<xsl:param name="passedRoot" />
		<xsl:variable name="rootDoc" select="$passedRoot/*[1]" />
		
		<xsl:variable name="rootProject" select="$rootDoc/graph/node[1]" />
		<xsl:value-of select="gb:buildDepRec($rootDoc, $rootProject/@id, $rootProject/@id)" />
    </xsl:function>
    
    <xsl:function name="gb:buildDepRec" xpath-default-namespace="http://graphml.graphdrawing.org/xmlns">
    	<xsl:param name="rootDoc" />
    	<xsl:param name="depSourceId" />
    	<xsl:param name="rootId" />
    	
    	<xsl:variable name="deps" select="$rootDoc/graph/edge[@source=$depSourceId]"/>
    	<xsl:for-each select="$deps">
    		<xsl:variable name="targetId" select="./@target" />
    		<xsl:value-of select="gb:buildDepRec($rootDoc, $targetId, $rootId)" />
    		
			<xsl:variable name="depCoord" select="gb:resolveMavenCoords($rootDoc/graph/node[@id=$targetId])" />
    		<xsl:choose>
				<xsl:when test="boolean($depCoord/gb:classifier/text() = 'lib') and boolean($depSourceId = $rootId)">
					<xsl:value-of select="concat($nl, '// @require ', $resPathAdjust, 'libs/', $depCoord/gb:name, '.js')" />
				</xsl:when>
				
				<xsl:when test="boolean($depCoord/gb:classifier/text() = 'lib') and boolean($depSourceId != $rootId)">
					<xsl:value-of select="concat($nl, '// @resource libs_', $depCoord/gb:name, ' ', $resPathAdjust, 'libs/', $depCoord/gb:name, '.js')" />
				</xsl:when>
				
				<xsl:when test="$depCoord/gb:classifier/text() = 'plugin'">
					<xsl:value-of select="concat($nl, '// @resource plugin_', $depCoord/gb:name, ' ', $resPathAdjust, 'plugins/', $depCoord/gb:fullname, '.user.js')" />
				</xsl:when>
			</xsl:choose>
    	</xsl:for-each>
    </xsl:function>
    
    <xsl:function name="gb:buildResources">
    	<xsl:variable name="resList" select="tokenize(gb:loadTextFile('/target/tmp/resources.list'), '\r?\n')" />
    	<xsl:for-each select="$resList">
    		<xsl:if test="string-length() &gt; 0">
	    		<xsl:value-of select="concat($nl, '// @resource ', gb:resourceNameFromFile(.), ' ', $resPathAdjust, 'res/', string(.))" />
    		</xsl:if>
    	</xsl:for-each>
    </xsl:function>
    
    <xsl:function name="gb:resourceNameFromFile">
    	<xsl:param name="filename" />
    	<xsl:variable name="splitted" select="tokenize($filename, '\.')"/>
    	<xsl:value-of select="concat($splitted[2], '_', $splitted[1])"/>
    </xsl:function>
    
    <xsl:function name="gb:resolveMavenCoords">
    	<xsl:param name="coordString" />
	    	
    	<xsl:variable name="splitted" select="tokenize($coordString, ':')" />
    	
    	<coord xmlns="http://gb/v3/js" >
    		<namespace><xsl:value-of select="$splitted[1]" /></namespace>
    		<name><xsl:value-of select="$splitted[2]" /></name>
    		<fullname><xsl:value-of select="concat($splitted[1], '_', $splitted[2])" /></fullname>
    		<type><xsl:value-of select="$splitted[3]" /></type>
    		<classifier><xsl:value-of select="$splitted[4]" /></classifier>
    		<version><xsl:value-of select="$splitted[5]" /></version>
    	</coord>
    </xsl:function>
    
	<xsl:function name="gb:loadInclExcl">
		<xsl:variable name="splittedInc" select="tokenize($includeUrls, ';')" />
		<xsl:if test="count($splittedInc) &gt; 0">
			<xsl:for-each select="$splittedInc">
				<xsl:value-of select="concat($nl, '// @include *v3.verbranntezone.ch', string(.))"/>
			</xsl:for-each>
		</xsl:if>
		
		<xsl:variable name="splittedEx" select="tokenize($excludeUrls, ';')" />
		<xsl:if test="count($splittedEx) &gt; 0">
			<xsl:for-each select="$splittedEx">
				<xsl:value-of select="concat($nl, '// @exclude *v3.verbranntezone.ch', string(.))"/>
			</xsl:for-each>
		</xsl:if>
	</xsl:function>
</xsl:stylesheet>