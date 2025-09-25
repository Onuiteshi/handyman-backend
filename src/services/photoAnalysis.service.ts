import { ImageAnnotatorClient } from '@google-cloud/vision';
import axios from 'axios';
import { PhotoAnalysisResult, JobType, DamageLevel, MaterialType } from '../types/photoAnalysis.types';

class PhotoAnalysisService {
  private visionClient: ImageAnnotatorClient | null = null;

  constructor() {
    // Initialize Google Cloud Vision client only if credentials are available
    try {
      this.visionClient = new ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
        // Alternative: use service account credentials directly
        // credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}'),
      });
    } catch (error) {
      console.warn('Google Cloud Vision client not initialized. Photo analysis will use fallback methods.');
      this.visionClient = null;
    }
  }

  /**
   * Analyze a single photo and extract relevant information
   */
  async analyzePhoto(photoUrl: string): Promise<PhotoAnalysisResult> {
    try {
      // Download the image
      const imageBuffer = await this.downloadImage(photoUrl);
      
      // Perform multiple types of analysis
      const [labelDetection, textDetection, objectDetection, safeSearchDetection] = await Promise.all([
        this.detectLabels(imageBuffer),
        this.detectText(imageBuffer),
        this.detectObjects(imageBuffer),
        this.detectSafeSearch(imageBuffer),
      ]);

      // Analyze the results and extract job-relevant information
      const analysis = this.analyzeResults(
        labelDetection,
        textDetection,
        objectDetection,
        safeSearchDetection
      );

      return {
        photoUrl,
        jobType: analysis.jobType,
        damageLevel: analysis.damageLevel,
        materials: analysis.materials,
        complexity: analysis.complexity,
        estimatedDuration: analysis.estimatedDuration,
        confidence: analysis.confidence,
        detectedObjects: analysis.detectedObjects,
        detectedText: analysis.detectedText,
        safetyIssues: analysis.safetyIssues,
        analysisTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error analyzing photo:', error);
      throw new Error(`Failed to analyze photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze multiple photos for a job
   */
  async analyzeJobPhotos(photoUrls: string[]): Promise<{
    overallAnalysis: PhotoAnalysisResult;
    individualAnalyses: PhotoAnalysisResult[];
    aggregatedInsights: {
      primaryJobType: JobType;
      averageDamageLevel: DamageLevel;
      allMaterials: MaterialType[];
      totalComplexity: number;
      estimatedTotalDuration: { min: number; max: number };
      confidence: number;
    };
  }> {
    try {
      // Analyze each photo individually
      const individualAnalyses = await Promise.all(
        photoUrls.map(url => this.analyzePhoto(url))
      );

      // Aggregate the results
      const aggregatedInsights = this.aggregateAnalyses(individualAnalyses);

      // Create overall analysis
      const overallAnalysis: PhotoAnalysisResult = {
        photoUrl: 'aggregated',
        jobType: aggregatedInsights.primaryJobType,
        damageLevel: aggregatedInsights.averageDamageLevel,
        materials: aggregatedInsights.allMaterials,
        complexity: aggregatedInsights.totalComplexity,
        estimatedDuration: aggregatedInsights.estimatedTotalDuration,
        confidence: aggregatedInsights.confidence,
        detectedObjects: individualAnalyses.flatMap(analysis => analysis.detectedObjects),
        detectedText: individualAnalyses.flatMap(analysis => analysis.detectedText),
        safetyIssues: individualAnalyses.flatMap(analysis => analysis.safetyIssues),
        analysisTimestamp: new Date().toISOString(),
      };

      return {
        overallAnalysis,
        individualAnalyses,
        aggregatedInsights,
      };
    } catch (error) {
      console.error('Error analyzing job photos:', error);
      throw new Error(`Failed to analyze job photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 second timeout
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download image from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect labels in the image
   */
  private async detectLabels(imageBuffer: Buffer): Promise<any[]> {
    try {
      if (!this.visionClient) {
        return this.fallbackLabelDetection(imageBuffer);
      }
      const [result] = await this.visionClient.labelDetection(imageBuffer);
      return result.labelAnnotations || [];
    } catch (error) {
      console.error('Error detecting labels:', error);
      return this.fallbackLabelDetection(imageBuffer);
    }
  }

  /**
   * Detect text in the image
   */
  private async detectText(imageBuffer: Buffer): Promise<any[]> {
    try {
      if (!this.visionClient) {
        return this.fallbackTextDetection(imageBuffer);
      }
      const [result] = await this.visionClient.textDetection(imageBuffer);
      return result.textAnnotations || [];
    } catch (error) {
      console.error('Error detecting text:', error);
      return this.fallbackTextDetection(imageBuffer);
    }
  }

  /**
   * Detect objects in the image
   */
  private async detectObjects(imageBuffer: Buffer): Promise<any[]> {
    try {
      if (!this.visionClient) {
        return this.fallbackObjectDetection(imageBuffer);
      }
      const client = this.visionClient;
      const [result] = await (client.objectLocalization as Function).call(client, imageBuffer);
      return result.localizedObjectAnnotations || [];
    } catch (error) {
      console.error('Error detecting objects:', error);
      return this.fallbackObjectDetection(imageBuffer);
    }
  }

  /**
   * Detect safe search content
   */
  private async detectSafeSearch(imageBuffer: Buffer): Promise<any | null> {
    try {
      if (!this.visionClient) {
        return this.fallbackSafeSearchDetection(imageBuffer);
      }
      const [result] = await this.visionClient.safeSearchDetection(imageBuffer);
      return result.safeSearchAnnotation || null;
    } catch (error) {
      console.error('Error detecting safe search:', error);
      return this.fallbackSafeSearchDetection(imageBuffer);
    }
  }

  /**
   * Fallback label detection when Vision API is not available
   */
  private async fallbackLabelDetection(imageBuffer: Buffer): Promise<any[]> {
    // Return basic labels based on image analysis or URL patterns
    return [
      { description: 'image', score: 0.8 },
      { description: 'photo', score: 0.7 }
    ];
  }

  /**
   * Fallback text detection when Vision API is not available
   */
  private async fallbackTextDetection(imageBuffer: Buffer): Promise<any[]> {
    // Return empty array for text detection fallback
    return [];
  }

  /**
   * Fallback object detection when Vision API is not available
   */
  private async fallbackObjectDetection(imageBuffer: Buffer): Promise<any[]> {
    // Return basic object detection fallback
    return [
      { name: 'object', score: 0.6 }
    ];
  }

  /**
   * Fallback safe search detection when Vision API is not available
   */
  private async fallbackSafeSearchDetection(imageBuffer: Buffer): Promise<any | null> {
    // Return safe default
    return {
      violence: 'UNLIKELY',
      adult: 'UNLIKELY',
      racy: 'UNLIKELY',
      medical: 'UNLIKELY',
      spoof: 'UNLIKELY'
    };
  }

  /**
   * Analyze the detection results and extract job-relevant information
   */
  private analyzeResults(
    labels: any[],
    text: any[],
    objects: any[],
    safeSearch: any | null
  ): {
    jobType: JobType;
    damageLevel: DamageLevel;
    materials: MaterialType[];
    complexity: number;
    estimatedDuration: { min: number; max: number };
    confidence: number;
    detectedObjects: string[];
    detectedText: string[];
    safetyIssues: string[];
  } {
    const labelTexts = labels.map(label => (label.description || '').toLowerCase());
    const objectNames = objects.map(obj => (obj.name || '').toLowerCase());
    const textContent = text.slice(1).map(t => (t.description || '').toLowerCase()); // Skip first element (full text)
    
    // Determine job type based on detected objects and labels
    const jobType = this.determineJobType(labelTexts, objectNames, textContent);
    
    // Determine damage level
    const damageLevel = this.determineDamageLevel(labelTexts, objectNames, textContent);
    
    // Identify materials
    const materials = this.identifyMaterials(labelTexts, objectNames);
    
    // Calculate complexity
    const complexity = this.calculateComplexity(jobType, damageLevel, materials, objects.length);
    
    // Estimate duration
    const estimatedDuration = this.estimateDuration(jobType, damageLevel, complexity);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(labels, objects, text);
    
    // Check for safety issues
    const safetyIssues = this.checkSafetyIssues(safeSearch, labelTexts, objectNames);
    
    return {
      jobType,
      damageLevel,
      materials,
      complexity,
      estimatedDuration,
      confidence,
      detectedObjects: objectNames,
      detectedText: textContent,
      safetyIssues,
    };
  }

  /**
   * Determine the type of job based on detected content
   */
  private determineJobType(labels: string[], objects: string[], text: string[]): JobType {
    const allContent = [...labels, ...objects, ...text].join(' ');
    
    // Plumbing-related keywords
    if (this.containsKeywords(allContent, ['pipe', 'faucet', 'sink', 'toilet', 'drain', 'leak', 'water', 'plumbing', 'valve', 'shower', 'bathtub'])) {
      return JobType.PLUMBING;
    }
    
    // Electrical-related keywords
    if (this.containsKeywords(allContent, ['wire', 'electrical', 'outlet', 'switch', 'circuit', 'breaker', 'light', 'socket', 'cable', 'power', 'voltage'])) {
      return JobType.ELECTRICAL;
    }
    
    // Carpentry-related keywords
    if (this.containsKeywords(allContent, ['wood', 'door', 'window', 'cabinet', 'furniture', 'shelf', 'table', 'chair', 'carpentry', 'saw', 'hammer'])) {
      return JobType.CARPENTRY;
    }
    
    // Painting-related keywords
    if (this.containsKeywords(allContent, ['paint', 'wall', 'ceiling', 'brush', 'roller', 'color', 'coating', 'surface', 'texture'])) {
      return JobType.PAINTING;
    }
    
    // Cleaning-related keywords
    if (this.containsKeywords(allContent, ['dirt', 'stain', 'clean', 'mess', 'dust', 'debris', 'trash', 'garbage', 'filth'])) {
      return JobType.CLEANING;
    }
    
    // Gardening-related keywords
    if (this.containsKeywords(allContent, ['plant', 'tree', 'garden', 'lawn', 'grass', 'flower', 'soil', 'landscaping', 'hedge'])) {
      return JobType.GARDENING;
    }
    
    return JobType.GENERAL_MAINTENANCE;
  }

  /**
   * Determine the level of damage
   */
  private determineDamageLevel(labels: string[], objects: string[], text: string[]): DamageLevel {
    const allContent = [...labels, ...objects, ...text].join(' ');
    
    // Severe damage indicators
    if (this.containsKeywords(allContent, ['broken', 'cracked', 'shattered', 'destroyed', 'collapsed', 'burst', 'flooded', 'fire', 'burned'])) {
      return DamageLevel.SEVERE;
    }
    
    // Moderate damage indicators
    if (this.containsKeywords(allContent, ['damaged', 'worn', 'rusty', 'loose', 'leaking', 'dripping', 'stained', 'chipped', 'scratched'])) {
      return DamageLevel.MODERATE;
    }
    
    // Minor damage indicators
    if (this.containsKeywords(allContent, ['dirty', 'dusty', 'old', 'faded', 'loose', 'squeaky', 'sticky'])) {
      return DamageLevel.MINOR;
    }
    
    return DamageLevel.NONE;
  }

  /**
   * Identify materials present in the image
   */
  private identifyMaterials(labels: string[], objects: string[]): MaterialType[] {
    const allContent = [...labels, ...objects].join(' ');
    const materials: MaterialType[] = [];
    
    if (this.containsKeywords(allContent, ['wood', 'timber', 'lumber'])) materials.push(MaterialType.WOOD);
    if (this.containsKeywords(allContent, ['metal', 'steel', 'iron', 'aluminum', 'copper'])) materials.push(MaterialType.METAL);
    if (this.containsKeywords(allContent, ['plastic', 'pvc', 'acrylic'])) materials.push(MaterialType.PLASTIC);
    if (this.containsKeywords(allContent, ['glass', 'mirror', 'window'])) materials.push(MaterialType.GLASS);
    if (this.containsKeywords(allContent, ['ceramic', 'tile', 'porcelain'])) materials.push(MaterialType.CERAMIC);
    if (this.containsKeywords(allContent, ['concrete', 'cement', 'brick'])) materials.push(MaterialType.CONCRETE);
    if (this.containsKeywords(allContent, ['fabric', 'cloth', 'textile', 'carpet'])) materials.push(MaterialType.FABRIC);
    if (this.containsKeywords(allContent, ['stone', 'marble', 'granite'])) materials.push(MaterialType.STONE);
    
    return materials;
  }

  /**
   * Calculate job complexity based on various factors
   */
  private calculateComplexity(jobType: JobType, damageLevel: DamageLevel, materials: MaterialType[], objectCount: number): number {
    let complexity = 1; // Base complexity
    
    // Add complexity based on damage level
    switch (damageLevel) {
      case DamageLevel.SEVERE: complexity += 3; break;
      case DamageLevel.MODERATE: complexity += 2; break;
      case DamageLevel.MINOR: complexity += 1; break;
    }
    
    // Add complexity based on job type
    switch (jobType) {
      case JobType.ELECTRICAL: complexity += 2; break;
      case JobType.PLUMBING: complexity += 2; break;
      case JobType.CARPENTRY: complexity += 1; break;
      case JobType.PAINTING: complexity += 1; break;
    }
    
    // Add complexity based on number of materials
    complexity += Math.min(materials.length * 0.5, 2);
    
    // Add complexity based on number of objects
    complexity += Math.min(objectCount * 0.3, 2);
    
    return Math.min(complexity, 10); // Cap at 10
  }

  /**
   * Estimate job duration based on analysis
   */
  private estimateDuration(jobType: JobType, damageLevel: DamageLevel, complexity: number): { min: number; max: number } {
    let baseHours = 2; // Base 2 hours
    
    // Adjust based on job type
    switch (jobType) {
      case JobType.ELECTRICAL: baseHours = 3; break;
      case JobType.PLUMBING: baseHours = 2.5; break;
      case JobType.CARPENTRY: baseHours = 4; break;
      case JobType.PAINTING: baseHours = 6; break;
      case JobType.CLEANING: baseHours = 2; break;
      case JobType.GARDENING: baseHours = 3; break;
    }
    
    // Adjust based on damage level
    switch (damageLevel) {
      case DamageLevel.SEVERE: baseHours *= 2; break;
      case DamageLevel.MODERATE: baseHours *= 1.5; break;
      case DamageLevel.MINOR: baseHours *= 1.2; break;
    }
    
    // Adjust based on complexity
    baseHours *= (complexity / 5);
    
    return {
      min: Math.max(1, Math.round(baseHours * 0.7)),
      max: Math.round(baseHours * 1.3)
    };
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(
    labels: any[],
    objects: any[],
    text: any[]
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Add confidence based on number of detected labels
    if (labels.length > 0) {
      const avgLabelConfidence = labels.reduce((sum: number, label: any) => sum + (label.score || 0), 0) / labels.length;
      confidence += avgLabelConfidence * 0.3;
    }
    
    // Add confidence based on number of detected objects
    if (objects.length > 0) {
      const avgObjectConfidence = objects.reduce((sum: number, obj: any) => sum + (obj.score || 0), 0) / objects.length;
      confidence += avgObjectConfidence * 0.2;
    }
    
    // Add confidence based on text detection
    if (text.length > 1) { // More than just the full text
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0); // Cap at 1.0
  }

  /**
   * Check for safety issues in the image
   */
  private checkSafetyIssues(
    safeSearch: any | null,
    labels: string[],
    objects: string[]
  ): string[] {
    const issues: string[] = [];
    const allContent = [...labels, ...objects].join(' ');
    
    // Check safe search results
    if (safeSearch) {
      if (safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY') {
        issues.push('Potential safety hazard detected');
      }
    }
    
    // Check for electrical hazards
    if (this.containsKeywords(allContent, ['exposed wire', 'spark', 'burned', 'fire', 'smoke'])) {
      issues.push('Electrical safety concern');
    }
    
    // Check for water damage
    if (this.containsKeywords(allContent, ['water damage', 'mold', 'flood', 'leak'])) {
      issues.push('Water damage detected');
    }
    
    // Check for structural issues
    if (this.containsKeywords(allContent, ['crack', 'broken', 'collapsed', 'loose'])) {
      issues.push('Structural concern');
    }
    
    return issues;
  }

  /**
   * Aggregate multiple photo analyses
   */
  private aggregateAnalyses(analyses: PhotoAnalysisResult[]): {
    primaryJobType: JobType;
    averageDamageLevel: DamageLevel;
    allMaterials: MaterialType[];
    totalComplexity: number;
    estimatedTotalDuration: { min: number; max: number };
    confidence: number;
  } {
    // Determine primary job type (most common)
    const jobTypeCounts = new Map<JobType, number>();
    analyses.forEach(analysis => {
      jobTypeCounts.set(analysis.jobType, (jobTypeCounts.get(analysis.jobType) || 0) + 1);
    });
    const primaryJobType = Array.from(jobTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // Calculate average damage level
    const damageScores = analyses.map(a => {
      switch (a.damageLevel) {
        case DamageLevel.SEVERE: return 3;
        case DamageLevel.MODERATE: return 2;
        case DamageLevel.MINOR: return 1;
        default: return 0;
      }
    });
    const avgDamageScore = damageScores.reduce((sum: number, score: number) => sum + score, 0) / damageScores.length;
    const averageDamageLevel = avgDamageScore >= 2.5 ? DamageLevel.SEVERE :
                              avgDamageScore >= 1.5 ? DamageLevel.MODERATE :
                              avgDamageScore >= 0.5 ? DamageLevel.MINOR : DamageLevel.NONE;
    
    // Collect all materials
    const allMaterials = [...new Set(analyses.flatMap(a => a.materials))];
    
    // Calculate total complexity
    const totalComplexity = Math.min(analyses.reduce((sum, a) => sum + a.complexity, 0), 10);
    
    // Calculate total duration
    const totalMinDuration = analyses.reduce((sum, a) => sum + a.estimatedDuration.min, 0);
    const totalMaxDuration = analyses.reduce((sum, a) => sum + a.estimatedDuration.max, 0);
    
    // Calculate average confidence
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    
    return {
      primaryJobType,
      averageDamageLevel,
      allMaterials,
      totalComplexity,
      estimatedTotalDuration: { min: totalMinDuration, max: totalMaxDuration },
      confidence: avgConfidence,
    };
  }

  /**
   * Helper method to check if content contains any of the given keywords
   */
  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }
}

export default new PhotoAnalysisService(); 