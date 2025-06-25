<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import * as d3 from 'd3';

  export let caseData: { id: string; relationships: any[] };

  const dispatch = createEventDispatcher();

  let svgElement: SVGSVGElement;

  function renderGraph() {
    const width = 600;
    const height = 400;

    const relationships = caseData.relationships || [];
    const nodes = Array.from(new Set(relationships.flatMap(r => [r.source, r.target]))).map(id => ({ id }));
    const links = relationships.map(r => ({
      source: r.source,
      target: r.target,
      type: r.type
    }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove(); // Clear previous render

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "link");

    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("class", "node")
      .attr("r", 10)
      .call(drag(simulation));

    node.append("title")
      .text((d: any) => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });
  }

  function drag(simulation: d3.Simulation<any, any>) {
    function dragstarted(event: d3.D3DragEvent<any, any, any>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<any, any, any>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<any, any, any>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  onMount(() => {
    if (caseData && caseData.relationships) {
      renderGraph();
    }
  });
</script>

<div class="graph-container">
  <svg bind:this={svgElement} width="600" height="400"></svg>
</div>

<style>
  .graph-container {
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
  }

  .node {
    fill: #2196F3;
    stroke: #fff;
    stroke-width: 2px;
  }

  .link {
    stroke: #999;
    stroke-opacity: 0.6;
  }
</style>
