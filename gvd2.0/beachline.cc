#include "beachline.hh"
#include "math.hh"
#include "utils.hh"
#include "nodeInsert.hh"

namespace
{
  bool isFlipped(vec2 p, vec2 b) // if p is the endpoint for seg.b
  {
    return math::equiv2(p, b);
  }

  static std::shared_ptr<Node> root = nullptr;

  // ////////////////////////////////////// Close Event Methods /////////////////////////

  bool validDiff(decimal_t diff)
  {
    return diff > 2e-2;
  }

  decimal_t getRadius(vec2 point, std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                    std::shared_ptr<Node> const& pr)
  {
    if (pl->aType == ArcType_e::ARC_V && pNode->aType == ArcType_e::ARC_V && pr->aType == ArcType_e::ARC_V)
    {
      return std::min(
        std::min(math::distLine(point, pl->a, pl->b), math::distLine(point, pNode->a, pNode->b)),
        math::distLine(point, pr->a, pr->b));
    }
    if (pl->aType == ArcType_e::ARC_PARA)
      return math::dist(point, pl->point);
    else if (pNode->aType == ArcType_e::ARC_PARA)
      return math::dist(point, pNode->point);

    return math::dist(point, pr->point);
  }

  std::shared_ptr<vec2> getIntercept(std::shared_ptr<Node> const& l, std::shared_ptr<Node> const& r, double directrix)
  {
    if (l->aType == ArcType_e::ARC_V && r->aType == ArcType_e::ARC_V)
      return intersectStraightArcs(l, r, directrix);
    else if (l->aType == ArcType_e::ARC_PARA && r->aType == ArcType_e::ARC_PARA)
      return intersectParabolicArcs(l, r, directrix);

    // if one is the endpoint of the other
    bool flipped = isFlipped(l->point, r->b) || isFlipped(r->point, l->b);
    return intersectParabolicToStraightArc(l, r, flipped, directrix);
  }

  decimal_t getDiff(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                    std::shared_ptr<Node> const& pr, vec2 p, double directrix)
  {
    auto radius = getRadius(p, pl, pNode, pr);
    auto newY = p.y - radius;
    auto newYErrorMargin = p.y - (radius + 1e-13);
    // rule out points too far above the directrix
    if (newY > directrix && newYErrorMargin > directrix) return 1e10;

    // Option: or test that left and right intersection
    auto i0 = getIntercept(pl, pNode, newY);
    auto i1 = getIntercept(pNode, pl, newY);
    if (!i0 || !i1) return 1e10;
    auto diffX = std::abs(i0->x - i1->x);
    auto diffY = std::abs(i0->y - i1->y);
    return diffX + diffY;
  }

  std::shared_ptr<vec2> chooseClosePoint(std::shared_ptr<Node> const& pl, std::shared_ptr<Node> const& pNode,
                  std::shared_ptr<Node> const& pr, double directrix)
  {
    return nullptr;
  //   if (_.isEmpty(points)) return null;
  //   if (points.length === 1) return points[0];
  //   var leastDiff = 10000;
  //   // length test - the length of node's arc should be close to 0
  //   // for the correct point
  //   var validPoints = _.sortBy(points, function (p) {
  //     var diff = getDiff(left, node, right, p, directrix);
  //     if (diff < leastDiff)
  //     leastDiff = diff;
  //     return diff;
  //   });
  //   if (!validDiff(leastDiff)) return null;
  //   return validPoints[0];
  }
}

std::shared_ptr<vec2> intersectStraightArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix)
{
  std::vector<vec2> ints;
  auto left = math::createV(l->a, l->b, directrix, l->id);
  auto right = math::createV(r->a, r->b, directrix, r->id);
  ints = math::vvIntersect(right, left);
  if (ints.empty())
  {
    std::cout << "Empty intersections v-v\n";
    return nullptr;
  }

  if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
  if (ints.size() > 2)
  {
    // get the two ints that are closest to the x value of the left v
    // less than sorts
    std::sort(ints.begin(), ints.end(), [x = right.point.x](vec2 a, vec2 b) {
        return std::abs(x - a.x) < std::abs(x - b.x);
    });
    ints = {ints[0], ints[1]};
    std::sort(ints.begin(), ints.end(), [](vec2 a, vec2 b) { return a.x < b.x; });
  }
  auto centX = (ints[0].x + ints[1].x) / 2.0;
  auto prevY = f_x(left, centX);
  auto nextY = f_x(right, centX);
  auto lower = 1;
  if (prevY < nextY)
    lower = 0;
  return std::make_shared<vec2>(ints[1-lower]);
}

std::shared_ptr<vec2> intersectParabolicToStraightArc(std::shared_ptr<Node> l, std::shared_ptr<Node> r,
 bool isFlipped, double directrix)
{
  std::vector<vec2> ints;
  if (l->aType == ArcType_e::ARC_PARA)
  {
    auto left = math::createParabola(l->point, directrix, l->id);
    auto right = math::createV(r->a, r->b, directrix, r->id);
    ints = math::vpIntersect(right, left);
    if (ints.empty())
    {
      // use a back-up line since the parabola is probably
      // so narrow that it won't intersect with any ray below p
      if (math::equiv2(l->point, r->a) || math::equiv2(l->point, r->b) && left.p < 1e-5)
      {
        auto backupLine = math::createLine(vec2(-1, left.focus.x), vec2(1, left.focus.y));
        ints = math::vbIntersect(right, backupLine);
      }
      if (ints.empty())
      {
        std::cout << "0 intersections between p - v";
        return nullptr;
      }
    }
    if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
    if (ints.size() > 2)
    {
      auto x = l->aType == ArcType_e::ARC_PARA ? l->point.x : r->point.x;
      // Test get the center intersections
      ints = consolidate(ints, x);
      if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
    }

    auto idx = 0;
    auto centX = (ints[0].x + ints[1].x) / 2.0;
    auto prevY = math::parabola_f(centX, left.h, left.k, left.p);
    auto nextY = f_x(right, centX);
    auto lower = 1;
    if (prevY < nextY)
      lower = 0;
    idx = 1 - lower;

    if (isFlipped && math::equiv2(l->point, r->b)) idx = lower;
    return std::make_shared<vec2>(ints[idx]);
  }

  auto left = math::createV(l->a, l->b, directrix, l->id);
  auto right = math::createParabola(r->point, directrix, l->id);
  ints = math::vpIntersect(left, right);
  if (ints.empty())
  {
    // use a back-up line since the parabola is probably
    // so narrow that it won't intersect with any ray below p
    if (math::equiv2(r->point, l->a) || math::equiv2(r->point, l->b) && right.p < 1e-5)
    {
      auto backupLine = math::createLine(vec2(-1, right.focus.x), vec2(1, right.focus.y));
      ints = math::vbIntersect(left, backupLine);
    }
    if (ints.empty())
    {
      std::cout << "0 intersections between p - v";
      return nullptr;
    }
  }
  if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
  if (ints.size() > 2)
  {
    auto x = l->aType == ArcType_e::ARC_PARA ? r->point.x : r->point.x;
    // Test get the center intersections
    ints = consolidate(ints, x);
    if (ints.size() == 1) return std::make_shared<vec2>(ints[0]);
  }

  auto idx = 0;
  auto centX = (ints[0].x + ints[1].x) / 2.0;
  auto prevY = f_x(left, centX);
  auto nextY = math::parabola_f(centX, right.h, right.k, right.p);
  auto lower = 1;
  if (prevY < nextY)
    lower = 0;
  idx = 1 - lower;

  if (isFlipped && math::equiv2(l->point, l->b)) idx = lower;
  return std::make_shared<vec2>(ints[idx]);
}

std::shared_ptr<vec2> intersectParabolicArcs(std::shared_ptr<Node> l, std::shared_ptr<Node> r, double directrix)
{
  auto left = math::createParabola(l->point, directrix, l->id);
  auto right = math::createParabola(r->point, directrix, l->id);
  auto ints = math::ppIntersect(left.h, left.k, left.p, right.h, right.k, right.p);

  if (ints.empty()) throw std::runtime_error("Invalid intersection p-p");

  auto centX = (ints[0].x + ints[1].x) / 2.0;
  auto prevY = math::parabola_f(centX, left.h, left.k, left.p);
  auto nextY = math::parabola_f(centX, right.h, right.k, right.p);
  auto lower = 1;
  if (prevY < nextY)
    lower = 0;
  return std::make_shared<vec2>(ints[1-lower]);
}

std::shared_ptr<vec2> intersection(std::shared_ptr<Node> edge, double directrix)
{
  auto l = edge->prevArc();
  auto r = edge->nextArc();
  return getIntercept(l, r, directrix);
}

std::shared_ptr<Event> createCloseEvent(std::shared_ptr<Node> const& arcNode, double directrix)
{
  if (!arcNode) return nullptr;
  auto left = arcNode->prevArc();
  auto right = arcNode->nextArc();
  if (!left || right) return nullptr;
  return nullptr;
  // auto closePoint;

  // if (arcNode->aType == ArcType_e::ARC_PARA 
  //     && left->aType == ArcType_e::ARC_PARA 
  //     && left->aType == ArcType_e::ARC_PARA) 
  //   {
  //   // All three are points
  //   auto equi = math::equidistant(left->point, arcNode->point, right->point);
  //   if (!equi) {
  //     // console.log("Equi point null between 3 point sites");
  //     return null;
  //   }
  //   closePoint = equi[0];
  //   if (closePoint == null) return null;
  //   var u = subtract(left.site, arcNode.site);
  //   var v = subtract(left.site, right.site);
  //   // Check if there should be a close event added. In some
  //   // cases there shouldn't be.
  //   if (cross(u, v)[2] < 0) {
  //     let r = length(subtract(arcNode.site, closePoint));
  //     let event_y = closePoint[1] - r;
  //     return new CloseEvent(event_y, arcNode, left, right, closePoint, r);
  //   }
  //   return null;
  // }

  // if (arcNode.isV) {
  //   if (arcNode.site.a == left.site && arcNode.site.b == right.site
  //     || arcNode.site.b == left.site && arcNode.site.a == right.site) return null;
  //   // If siblings reference the same closing node don't let them close until
  //   // the closing node is processed
  //   if (shareVClosing(arcNode, left) || shareVClosing(arcNode, right)) return null;
  // }

  // // can compute up to 6 equi points
  // var points = equidistant(left.site, arcNode.site, right.site);

  // // debugging only
  // // if (g_addDebug) {
  // //   _.forEach(points, function(p) {
  // //     g_debugObjs.push(p);
  // //   });
  // // }

  // // guilty by association
  // _.forEach([left, arcNode, right], function(node) {
  //   points = node.isV ? filterVisiblePoints(node.site, points) : points;
  // });

  // if (points == null || points.length == 0) return null;

  // // filter by site association
  // points = filterBySiteAssociation(left, arcNode, right, points);

  // if (points == null || points.length == 0) return null;
  // if (points.length == 1) {
  //   closePoint = points[0];
  //   var diff = getDiff(left, arcNode, right, closePoint, directrix);
  //   if (!validDiff(diff)) return null;
  // } else {
  //   var p = chooseClosePoint(left, arcNode, right, points, directrix);
  //   if (!p) return null;
  //   closePoint = p;
  // }

  // var radius = getRadius(closePoint, left, arcNode, right);
  // if (_.isUndefined(radius)) throw "invalid radius";

  // return new CloseEvent(closePoint[1] - radius, arcNode, left, right, closePoint, radius);
}

std::vector<Event> processCloseEvents(std::vector<std::shared_ptr<Node>> closingNodes, double directrix) 
{
  std::vector<Event> ret;
  for (auto&& n : closingNodes)
  {
    auto e = createCloseEvent(n, directrix);
    if (e)
      ret.push_back(*e);
  }

  return ret;
}

std::vector<Event> add(std::shared_ptr<Node> const& pChild, EventPacket const& packet)
{
  auto arcNode = math::createArcNode(packet.site);
  auto directrix = packet.site.point.y;

  if (root == nullptr) 
  {
    auto subTreeData = generateSubTree(packet, arcNode, nullptr);
    root = subTreeData.root;
    return {};
  }

  auto parent = root;
  // var side, child;
  std::shared_ptr<Node> child;

  if (root->aType != ArcType_e::EDGE) 
  {
    child = root;
    auto subTreeData = generateSubTree(packet, arcNode, child);
    root = subTreeData.root;
    return processCloseEvents(subTreeData.nodesToClose, directrix);
  }

  // Do a binary search to find the arc node that the new
  // site intersects with
  auto rslt = intersection(parent, directrix);
  if (!rslt) throw std::runtime_error("Invalid intersection on add()");
  auto side = (packet.site.point.x < rslt->x) ? Side_e::LEFT : Side_e::RIGHT;
  child = math::getChild(parent, side);
  while (child->aType == ArcType_e::EDGE) 
  {
    parent = child;
    auto i = intersection(parent, directrix);
    if (!i) 
    {
      throw "Invalid intersection on 'Add'";
    } 
    side = (packet.site.point.x < i->x) ? Side_e::LEFT : Side_e::RIGHT;
    child = math::getChild(parent, side);
  }

  auto subTreeData = generateSubTree(packet, arcNode, child);
  math::setChild(parent, subTreeData.root, side);
  
  return processCloseEvents(subTreeData.nodesToClose, directrix);
}

std::vector<Event> remove(std::shared_ptr<Node> const& arcNode, vec2 point,
            double directrix, std::vector<std::shared_ptr<Node>> const& endingEdges)
{
  // if (!arcNode.isArc) throw "Unexpected edge in remove";

  auto parent = arcNode->pParent;
  auto grandparent = parent->pParent;
  auto side = (parent->pLeft && parent->pLeft->id == arcNode->id) ? Side_e::LEFT : Side_e::RIGHT;
  auto parentSide = (grandparent->pLeft->id == parent->id) ? Side_e::LEFT : Side_e::RIGHT;

  // Get newEdge (an EdgeNode) before updating children etc.
  auto newEdge = arcNode->nextEdge();
  if (side == Side_e::LEFT) {
    newEdge = arcNode->prevEdge();
  }

  auto siblingSide = side == Side_e::LEFT ? Side_e::RIGHT : Side_e::LEFT;
  auto sibling = math::getChild(parent, siblingSide);
  math::setChild(grandparent, sibling, parentSide);
  sibling->pParent = grandparent;

  // TODO update edge
  // newEdge.updateEdge(point, this.dcel, [], endingEdges);
  arcNode->live = false;

  // Cancel the close event for this arc and adjoining arcs.
  // Add new close events for adjoining arcs.
  // var closeEvents = [];
  std::vector<Event> closeEvents;
  auto prevArc = newEdge->prevArc();
  prevArc->live = false;
  auto e = createCloseEvent(prevArc, directrix);
  if (e)
    closeEvents.push_back(*e);

  auto nextArc = newEdge->nextArc();
  nextArc->live = false;
  e = createCloseEvent(nextArc, directrix);
  if (e)
    closeEvents.push_back(*e);
  return closeEvents;
}

